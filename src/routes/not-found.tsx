import { A } from '@solidjs/router';

import { Button } from '~/components/ui/button';

export function NotFound(props: { session?: boolean }) {
  return (
    <div class="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 class="text-3xl font-medium">
        {props.session ? 'Session not found' : 'Page not found'}
      </h1>
      <p class="text-muted">
        {props.session
          ? 'This session may have been deleted or the link is incorrect.'
          : 'The page you are looking for does not exist.'}
      </p>
      <Button as={A} href="/">
        Go to home
      </Button>
    </div>
  );
}
