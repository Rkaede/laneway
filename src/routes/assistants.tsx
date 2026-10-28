import { type Component, createResource, createSignal, For, Show } from 'solid-js';

import { ChatSettings } from '~/components/connected/chat-settings';
import { ModelIcon } from '~/components/connected/model-icon';
import { showSuccess } from '~/components/ui/notifications';
import { setStore, store } from '~/store';
import { addAssistant, deleteAssistant } from '~/store/actions';
import { validateAssistant } from '~/store/editor-validation';
import { selectModelById } from '~/store/selectors';
import type { AssistantProps } from '~/types';

import {
  TemplateCard,
  TemplateDeleteDialog,
  TemplateDetailsDialog,
  TemplateDetailsFooter,
  TemplateGalleryCard,
  TemplateGalleryDialog,
  TemplatePage,
  TemplateValidationError,
} from './template-collection';
import { createTemplateEditor, fetchTemplateGallery } from './template-helpers';

export default function Assistants() {
  const [selectedAssistant, setSelectedAssistant] = createSignal<AssistantProps | null>(null);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [isNewAssistant, setIsNewAssistant] = createSignal(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = createSignal(false);
  const [assistantToDelete, setAssistantToDelete] = createSignal<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = createSignal(false);
  const [galleryAssistants] = createResource(() =>
    fetchTemplateGallery<AssistantProps>('/assistants.json'),
  );

  function handleAdd() {
    const newAssistant: AssistantProps = {
      id: '',
      title: 'New Assistant',
      subtitle: '',
      modelId: '',
      systemPrompt: '',
    };
    setSelectedAssistant(newAssistant);
    setIsNewAssistant(true);
    setIsModalOpen(true);
  }

  function handleDeleteAssistant(assistantId: string) {
    setAssistantToDelete(assistantId);
    setIsDeleteConfirmOpen(true);
  }

  function confirmDeleteAssistant() {
    const assistant = assistantToDelete();
    if (assistant) {
      deleteAssistant(assistant);
      setSelectedAssistant(null);
      setIsModalOpen(false);
      setIsDeleteConfirmOpen(false);
      setAssistantToDelete(null);
      showSuccess('Assistant deleted.');
    }
  }

  function handleAddFromGallery(assistant: AssistantProps) {
    addAssistant(assistant);
    setIsGalleryOpen(false);
    showSuccess('Assistant added.');
  }

  return (
    <>
      <TemplatePage
        title="Assistants"
        description="Assistants are AI models with predefined prompts and settings."
        itemName="Assistant"
        emptyDescription="Create an assistant or add one from the Assistant Library."
        items={store.assistants}
        getTitle={(assistant) => assistant.title}
        onAdd={handleAdd}
        onOpenGallery={() => setIsGalleryOpen(true)}
      >
        {(assistant) => (
          <AssistantCard
            assistant={assistant}
            onEdit={() => {
              setSelectedAssistant(assistant);
              setIsNewAssistant(false);
              setIsModalOpen(true);
            }}
            onDelete={() => handleDeleteAssistant(assistant.id)}
          />
        )}
      </TemplatePage>

      <TemplateDetailsDialog
        title={isNewAssistant() ? 'New Assistant' : 'Edit Assistant'}
        isOpen={isModalOpen()}
        onOpenChange={setIsModalOpen}
        selectedItem={selectedAssistant()}
      >
        {(assistant, onDirtyChange) => (
          <AssistantDetails
            onDirtyChange={onDirtyChange}
            initialAssistant={assistant}
            onClose={() => setIsModalOpen(false)}
            isNewAssistant={isNewAssistant()}
          />
        )}
      </TemplateDetailsDialog>

      <TemplateDeleteDialog
        isOpen={isDeleteConfirmOpen()}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={confirmDeleteAssistant}
      >
        Are you sure you want to delete this assistant? This action cannot be undone.
      </TemplateDeleteDialog>

      <AssistantGalleryDialog
        isOpen={isGalleryOpen()}
        onOpenChange={setIsGalleryOpen}
        onAddFromGallery={handleAddFromGallery}
        galleryAssistants={galleryAssistants()}
      />
    </>
  );
}

const AssistantGalleryDialog: Component<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddFromGallery: (assistant: AssistantProps) => void;
  galleryAssistants: AssistantProps[] | undefined;
}> = (props) => {
  return (
    <TemplateGalleryDialog
      title="Assistant Library"
      isOpen={props.isOpen}
      onOpenChange={props.onOpenChange}
    >
      <For each={props.galleryAssistants}>
        {(assistant) => (
          <TemplateGalleryCard
            title={
              <div class="flex items-center gap-2">
                <ModelIcon modelId={assistant.modelId} class="h-5 w-5" />
                {assistant.title}
              </div>
            }
            isAdded={store.assistants.some((a) => a.templateId === assistant.id)}
            validationError={validateAssistant(assistant, store.assistants)}
            onAdd={() => props.onAddFromGallery(assistant)}
          >
            <p class="text-sm text-muted">{assistant.subtitle}</p>
          </TemplateGalleryCard>
        )}
      </For>
    </TemplateGalleryDialog>
  );
};

const AssistantCard: Component<{
  assistant: AssistantProps;
  onEdit: () => void;
  onDelete: () => void;
}> = (props) => {
  const model = selectModelById(() => props.assistant.modelId);

  return (
    <TemplateCard
      title={
        <>
          <div>{props.assistant.title?.trim() || 'Untitled'}</div>
          <Show when={model()?.icon}>
            <ModelIcon modelId={model()?.id} class="mr-1 h-4 w-4" />
          </Show>
        </>
      }
      onEdit={props.onEdit}
      onDelete={props.onDelete}
    >
      <p class="mb-2 line-clamp-2 text-sm text-muted">
        {props.assistant.subtitle || 'No description'}
      </p>
    </TemplateCard>
  );
};

function AssistantDetails(props: {
  initialAssistant: AssistantProps;
  onClose: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  isNewAssistant: boolean;
}) {
  const {
    value: localAssistant,
    setValue: setLocalAssistant,
    validationError,
    hasChanges,
    save,
  } = createTemplateEditor({
    initialValue: () => props.initialAssistant,
    validate: (assistant) =>
      validateAssistant(
        assistant,
        store.assistants,
        props.isNewAssistant ? undefined : props.initialAssistant.id,
      ),
    onDirtyChange: props.onDirtyChange,
    onSave: (value) => {
      const assistant = { ...value, title: value.title.trim() };
      if (props.isNewAssistant) {
        addAssistant(assistant);
      } else {
        setStore('assistants', (a) => a.id === props.initialAssistant.id, assistant);
      }
      props.onClose();
      showSuccess('Assistant saved.');
    },
  });

  return (
    <>
      <div class="p-4">
        <ChatSettings
          name={localAssistant.title}
          subtitle={localAssistant.subtitle}
          modelId={localAssistant.modelId}
          systemPrompt={localAssistant.systemPrompt || ''}
          onNameChange={(value) => setLocalAssistant('title', value)}
          onModelChange={(value) => setLocalAssistant('modelId', value)}
          onSubtitleChange={(value) => setLocalAssistant('subtitle', value)}
          onSystemPromptChange={(value) => setLocalAssistant('systemPrompt', value)}
        />
        <TemplateValidationError error={validationError()} />
      </div>
      <TemplateDetailsFooter
        class="pt-6"
        onClose={props.onClose}
        onSave={save}
        disabled={!hasChanges() || !!validationError()}
      />
    </>
  );
}
