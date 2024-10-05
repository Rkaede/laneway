import { Component, createResource, For } from 'solid-js';

import { ModelIcon } from '~/components/connected';
import { IconCheck } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { store } from '~/store';
import type { AssistantProps } from '~/types';

const GalleryAssistantCard: Component<{
  assistant: AssistantProps;
  onAddFromGallery: (assistant: AssistantProps) => void;
}> = (props) => {
  const isAdded = () => store.assistants.some((a) => a.templateId === props.assistant.id);

  return (
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <ModelIcon modelId={props.assistant.modelId} class="size-5" />
            {props.assistant.title}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-sm text-muted-foreground">{props.assistant.subtitle}</p>
        <div class="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={isAdded()}
            onClick={() => props.onAddFromGallery(props.assistant)}
          >
            {isAdded() ? (
              <div class="flex items-center gap-1">
                <div class="text-sm">Added</div>
                <IconCheck class="size-4 text-green-500" />
              </div>
            ) : (
              'Add'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

async function fetchAssistants() {
  const response = await fetch('/assistants.json');
  return response.json();
}

const GalleryAssistantList: Component<{
  onAddFromGallery: (assistant: AssistantProps) => void;
}> = (props) => {
  const [assistants] = createResource(fetchAssistants);

  return (
    <For each={assistants()}>
      {(assistant) => (
        <GalleryAssistantCard assistant={assistant} onAddFromGallery={props.onAddFromGallery} />
      )}
    </For>
  );
};

export default GalleryAssistantList;
