import type { Component } from 'solid-js';

import { IconKey } from '~/components/icons/ui';
import { Alert, AlertDescription, AlertTitle, Button } from '~/components/ui';

export const AlertApiKey: Component<{ onNavigateToSettings: () => void }> = (props) => (
  <div class="p-2">
    <Alert variant="warning">
      <IconKey class="h-4 w-4" />
      <AlertTitle>API Key Not Configured</AlertTitle>
      <AlertDescription>
        The API key for this model's provider is not configured. Please set it up in the
        settings.
      </AlertDescription>
      <Button class="mt-2" variant="outline" onClick={props.onNavigateToSettings}>
        Go to Settings
      </Button>
    </Alert>
  </div>
);
