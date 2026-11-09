import About from '~/components/connected/about';
import { Button } from '~/components/ui/button';
import { showAboutDialog } from '~/store/actions';

export function Default() {
  return (
    <div>
      <Button variant="outline" onClick={showAboutDialog}>
        Open About
      </Button>
      <About />
    </div>
  );
}
