import { lazy } from 'solid-js';

import { CodeBlock } from '~/components/ui';
const TextEditor = lazy(() => import('../components/ui/text-editor/text-editor'));
import { store } from '~/store';

const config = {
  richtexteditor: true,
  state: true,
};

export default function Debug() {
  return (
    <div class="h-full overflow-auto px-10 py-4 text-sm">
      {config.richtexteditor && (
        <div>
          <TextEditor />
        </div>
      )}
      {config.state && (
        <div class="w-full">
          <CodeBlock language="json" code={JSON.stringify(store, null, 2)} />
        </div>
      )}
    </div>
  );
}
