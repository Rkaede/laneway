import About from '~/components/connected/about';
import { Button } from '~/components/ui/button';
import { setStore } from '~/store';

export function Default() {
  return (
    <div>
      <Button variant="outline" onClick={() => setStore('dialogs', 'about', 'open', true)}>
        Open About
      </Button>
      <About />
    </div>
  );
}
