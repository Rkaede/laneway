import { createSignal } from 'solid-js';

interface useCopyToClipboardProps {
  timeout?: number;
}

export function useCopyToClipboard({ timeout = 2000 }: useCopyToClipboardProps) {
  const [isCopied, setIsCopied] = createSignal(false);

  const copyToClipboard = (value: string | Blob) => {
    if (typeof window === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    if (!value) {
      return;
    }

    if (typeof value === 'string') {
      navigator.clipboard.writeText(value).then(() => {
        setIsCopied(true);

        setTimeout(() => {
          setIsCopied(false);
        }, timeout);
      });
    } else {
      navigator.clipboard
        .write([
          new ClipboardItem({
            'image/png': value,
          }),
        ])
        .then(() => {
          setIsCopied(true);

          setTimeout(() => {
            setIsCopied(false);
          }, timeout);
        });
    }
  };

  return { isCopied, copyToClipboard };
}
