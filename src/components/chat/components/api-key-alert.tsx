import type { Component } from 'solid-js';

import { IconKey } from '~/components/icons/ui';
import { Alert, AlertDescription, AlertTitle, Button } from '~/components/ui';

export const AlertApiKey: Component<{ onAddKey: () => void }> = (props) => (
  <div class="p-2">
    <Alert variant="warning">
      <IconKey class="h-4 w-4" />
      <AlertTitle>API Key Not Configured</AlertTitle>
      <AlertDescription>
        This model needs a key for a provider you have not added yet. An OpenRouter key works
        with every model.
      </AlertDescription>
      <Button class="mt-2" variant="outline" onClick={props.onAddKey}>
        Add a key
      </Button>
    </Alert>
  </div>
);
