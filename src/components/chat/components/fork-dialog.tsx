import { useNavigate } from '@solidjs/router';
import { type Component, createMemo, createSignal } from 'solid-js';

import { MultiCombobox } from '~/components/connected/multi-combobox';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '~/components/ui';
import { store } from '~/store';
import { forkSession } from '~/store/actions';
import { defaultForkTitle, type ForkTarget } from '~/store/branches';
import { selectSessionById } from '~/store/selectors';

type ForkDialogProps = {
  sessionId: string;
  chatId: string;
  messageId: string;
  onClose: () => void;
};

export const ForkDialog: Component<ForkDialogProps> = (props) => {
  const navigate = useNavigate();
  const session = selectSessionById(() => props.sessionId);
  const chat = createMemo(() => store.chats.find((c) => c.id === props.chatId));

  const defaultTitle = defaultForkTitle(session()?.title ?? 'Chat');
  const [title, setTitle] = createSignal(defaultTitle);
  const [target, setTarget] = createSignal<ForkTarget>();

  // What the fork will continue with: the chat's own model or assistant unless one is picked.
  function current(): ForkTarget {
    const picked = target();
    if (picked) return picked;
    const assistantId = chat()?.assistantId;
    if (assistantId) return { type: 'assistant', id: assistantId };
    return { type: 'model', id: chat()?.modelId ?? store.settings.defaultSession.id };
  }

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const id = forkSession({
      sessionId: props.sessionId,
      chatId: props.chatId,
      messageId: props.messageId,
      title: title(),
      target: target(),
    });
    if (!id) return;
    props.onClose();
    navigate(`/session/${id}`);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogContent as="form" onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Fork chat</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Copies the conversation up to this reply into a new chat. The original stays as it is.
        </DialogDescription>
        <div class="flex flex-col gap-3">
          <label class="flex flex-col gap-1 text-sm font-medium">
            Name
            <Input
              value={title()}
              onInput={(e) => setTitle(e.currentTarget.value)}
              placeholder={defaultTitle}
            />
          </label>
          <div class="flex flex-col gap-1 text-sm font-medium">
            Continue with
            <MultiCombobox
              value={current()}
              onSelect={({ referenceId, type }) =>
                setTarget({ type: type as ForkTarget['type'], id: referenceId })
              }
              includeModels
              includeAssistants
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Fork</Button>
          <Button type="button" variant="secondary" onClick={props.onClose}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
