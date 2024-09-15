import type { Component } from 'solid-js';

import { IconCircleX } from '~/components/icons/ui';
import { Alert, AlertDescription, AlertTitle, Button } from '~/components/ui';

export const AlertError: Component<{ error: { message: string }; onRetry: () => void }> = (
  props,
) => (
  <div class="p-2">
    <Alert variant="destructive">
      <IconCircleX class="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{props.error.message}</AlertDescription>
      <Button class="mt-2" variant="outline" onClick={props.onRetry}>
        Retry
      </Button>
    </Alert>
  </div>
);
