import { Show } from 'solid-js';

import { IconCheck, IconCopy } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import { useCopyToClipboard } from '~/hooks/use-copy';

export function CopyButton(props: { text: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  return (
    <Button
      variant="toolbar"
      size="toolbar"
      onClick={() => copyToClipboard(props.text)}
      title="Copy to clipboard"
    >
      <Show when={isCopied()} fallback={<IconCopy class="size-4" />}>
        <IconCheck class="size-4" />
      </Show>
    </Button>
  );
}
