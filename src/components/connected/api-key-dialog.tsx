import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui';
import { cn } from '~/util';

import { ApiKeyForm } from './api-key-form';
import { apiKeyRequest, requestApiKey, setApiKeyRequest } from './api-key-request';

export function ApiKeyDialog() {
  function handleSaved() {
    const onSaved = apiKeyRequest()?.onSaved;
    setApiKeyRequest(undefined);
    onSaved?.();
  }

  return (
    <Dialog
      open={apiKeyRequest() !== undefined}
      onOpenChange={(open) => !open && setApiKeyRequest(undefined)}
    >
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Add an API key</DialogTitle>
          <DialogDescription class="text-sm text-muted">
            Laneway sends your messages straight to the provider with your own key. The key
            stays in this browser.
          </DialogDescription>
        </DialogHeader>
        <ApiKeyForm
          submitLabel={apiKeyRequest()?.onSaved ? 'Save and send' : 'Save key'}
          onSaved={handleSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

/** A line for the composer while no key is set. */
export function KeyNotice(props: { class?: string }) {
  return (
    <p class={cn('text-sm text-muted', props.class)}>
      Add an API key to start chatting.{' '}
      <button
        type="button"
        class="font-medium text-main underline underline-offset-4"
        onClick={() => requestApiKey()}
      >
        Add key
      </button>
    </p>
  );
}
