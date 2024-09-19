import type { Component } from 'solid-js';

import { IconEyeOff } from '~/components/icons/ui';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui';

export const AlertNoVision: Component = () => (
  <div class="p-2">
    <Alert variant="warning">
      <IconEyeOff class="size-4" />
      <AlertTitle>Vision Not Supported</AlertTitle>
      <AlertDescription>
        This model does not support vision. The message cannot be sent.
      </AlertDescription>
    </Alert>
  </div>
);
