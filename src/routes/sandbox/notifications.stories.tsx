import { Button } from '~/components/ui/button';
import { Notifications, showSuccess } from '~/components/ui/notifications';

export function Toasts() {
  return (
    <div class="flex gap-2">
      {/* The app layout mounts this, and the sandbox sits outside it. */}
      <Notifications />
      <Button variant="outline" onClick={() => showSuccess('OpenRouter key saved.')}>
        Show a toast
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          showSuccess(
            'A much longer success message, to show how the text wraps next to the dismiss button.',
          )
        }
      >
        Show a long toast
      </Button>
    </div>
  );
}
