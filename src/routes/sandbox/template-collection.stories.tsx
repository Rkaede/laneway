import { createSignal, For } from 'solid-js';

import { Button } from '~/components/ui/button';
import { SettingTitle } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import {
  TemplateCard,
  TemplateDeleteDialog,
  TemplateDetailsDialog,
  TemplateDetailsFooter,
  TemplateGalleryCard,
  TemplateGalleryDialog,
  TemplatePage,
  TemplateValidationError,
} from '~/routes/template-collection';
import { noop } from '~/util';

import { Cell, CellHeader, Cells } from './story-components';

const items = ['Coding', 'Writing', 'Research'];

function Page(props: { items: string[] }) {
  return (
    <TemplatePage
      title="Assistants"
      description="Reusable personalities with their own model and prompt."
      itemName="Assistant"
      emptyDescription="Create an assistant, or add one from the library."
      items={props.items}
      getTitle={(item) => item}
      onAdd={noop}
      onOpenGallery={noop}
    >
      {(item) => (
        <TemplateCard title={item} onEdit={noop} onDelete={noop}>
          A card for {item}.
        </TemplateCard>
      )}
    </TemplatePage>
  );
}

export function PageWithItems() {
  return <Page items={items} />;
}

export function PageEmpty() {
  return <Page items={[]} />;
}

export function Card() {
  return (
    <div class="max-w-xs">
      <TemplateCard title="Coding" onEdit={noop} onDelete={noop}>
        Click the card to edit it, or use the menu to delete it.
      </TemplateCard>
    </div>
  );
}

export function GalleryCard() {
  return (
    <Cells class="grid-cols-3">
      <Cell>
        <CellHeader>Can be added</CellHeader>
        <TemplateGalleryCard
          title="Coding"
          isAdded={false}
          validationError={undefined}
          onAdd={noop}
        >
          A coding assistant.
        </TemplateGalleryCard>
      </Cell>
      <Cell>
        <CellHeader>Already added</CellHeader>
        <TemplateGalleryCard title="Coding" isAdded validationError={undefined} onAdd={noop}>
          A coding assistant.
        </TemplateGalleryCard>
      </Cell>
      <Cell>
        <CellHeader>Invalid (hover Add for the reason)</CellHeader>
        <TemplateGalleryCard
          title="Coding"
          isAdded={false}
          validationError="This model is no longer available."
          onAdd={noop}
        >
          A coding assistant.
        </TemplateGalleryCard>
      </Cell>
    </Cells>
  );
}

export function ValidationError() {
  return (
    <Cells>
      <Cell>
        <CellHeader>With an error</CellHeader>
        <TemplateValidationError error="A name is required." />
      </Cell>
      <Cell>
        <CellHeader>Without an error, nothing renders</CellHeader>
        <TemplateValidationError error={undefined} />
      </Cell>
    </Cells>
  );
}

export function Dialogs() {
  const [dialog, setDialog] = createSignal<'delete' | 'gallery' | 'details'>();
  const onOpenChange = (open: boolean) => {
    if (!open) setDialog(undefined);
  };

  return (
    <div class="flex gap-2">
      <Button variant="outline" onClick={() => setDialog('delete')}>
        Delete dialog
      </Button>
      <Button variant="outline" onClick={() => setDialog('gallery')}>
        Gallery dialog
      </Button>
      <Button variant="outline" onClick={() => setDialog('details')}>
        Details dialog
      </Button>

      <TemplateDeleteDialog
        isOpen={dialog() === 'delete'}
        onOpenChange={onOpenChange}
        onConfirm={() => setDialog(undefined)}
      >
        Delete the "Coding" assistant? This cannot be undone.
      </TemplateDeleteDialog>

      <TemplateGalleryDialog
        title="Assistant Library"
        description="Add a ready-made assistant to your collection."
        isOpen={dialog() === 'gallery'}
        onOpenChange={onOpenChange}
      >
        <For each={items}>
          {(item) => (
            <TemplateGalleryCard
              title={item}
              isAdded={item === 'Writing'}
              validationError={undefined}
              onAdd={noop}
            >
              An assistant for {item.toLowerCase()}.
            </TemplateGalleryCard>
          )}
        </For>
      </TemplateGalleryDialog>

      <TemplateDetailsDialog
        title="Edit assistant"
        isOpen={dialog() === 'details'}
        onOpenChange={onOpenChange}
        selectedItem={dialog() === 'details' ? { name: 'Coding' } : null}
      >
        {(item, onDirtyChange) => (
          <>
            <SettingTitle>Name</SettingTitle>
            <Input value={item.name} onInput={() => onDirtyChange(true)} />
            <TemplateDetailsFooter
              onClose={() => setDialog(undefined)}
              onSave={() => setDialog(undefined)}
              disabled={false}
            />
          </>
        )}
      </TemplateDetailsDialog>
    </div>
  );
}
