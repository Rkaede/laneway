import { toBlob, toPng } from 'html-to-image';
import type { Component, ParentComponent } from 'solid-js';

import { useCopyToClipboard } from '~/hooks/use-copy';
import { downloadFile, filenameDate } from '~/util';

import { IconCopy, IconDownload, IconImageDownload, IconImages } from '../icons/ui';
import { Button } from './button';
import { CodeHighlighter } from './code-highlighter';

interface CodeblockProps {
  language: string;
  code: string;
}

export const programmingLanguages: Record<string, string> = {
  javascript: '.js',
  python: '.py',
  java: '.java',
  c: '.c',
  cpp: '.cpp',
  csv: '.csv',
  'c++': '.cpp',
  'c#': '.cs',
  ruby: '.rb',
  php: '.php',
  swift: '.swift',
  'objective-c': '.m',
  kotlin: '.kt',
  typescript: '.ts',
  go: '.go',
  rust: '.rs',
  scala: '.scala',
  haskell: '.hs',
  lua: '.lua',
  shell: '.sh',
  sql: '.sql',
  html: '.html',
  css: '.css',
  // add more file extensions here, make sure the key is same as language prop in CodeBlock.tsx component
};

// const languages = Object.values(programmingLanguages).map((l) => l.split('.')[1]);

const filter = (node: HTMLElement) => {
  const exclusionClasses = ['screenshot-hide'];
  return !exclusionClasses.some((classname) => node.classList?.contains(classname));
};

export const CodeBlock: Component<CodeblockProps> = (props) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  function downloadAsFile() {
    if (typeof window === 'undefined') {
      return;
    }
    const fileExtension = programmingLanguages[props.language] || '.txt';
    const filename = filenameDate() + fileExtension;

    const blob = new Blob([props.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
    URL.revokeObjectURL(url);
  }

  function onCopy() {
    if (isCopied()) return;
    copyToClipboard(props.code);
  }

  let ref: HTMLDivElement | undefined;

  async function onCopyScreenshot() {
    if (ref === undefined) {
      return;
    }
    const blob = await toBlob(ref, { cacheBust: true, filter });
    if (blob) {
      copyToClipboard(blob);
    }
  }

  async function onDownloadScreenshot() {
    if (ref === undefined) {
      return;
    }
    const dataUrl = await toPng(ref, { cacheBust: true, filter, pixelRatio: 2 });
    const filename = filenameDate();
    downloadFile(dataUrl, `${filename}.png`);
  }

  return (
    <div class="codeblock group/toolbar w-full rounded font-sans" ref={ref}>
      <div class="flex w-full items-center justify-between px-4 py-0.5 pr-4 text-zinc-100">
        <span class="text-xs font-medium lowercase">{props.language}</span>
        <div class="invisible flex items-center space-x-1 group-hover/toolbar:visible">
          <CodeActionButton onClick={onDownloadScreenshot} label="Download screenshot">
            <IconImageDownload class="size-4" />
          </CodeActionButton>
          <CodeActionButton onClick={downloadAsFile} label="Download">
            <IconDownload class="size-4" />
          </CodeActionButton>
          <CodeActionButton onClick={onCopyScreenshot} label="Copy screenshot">
            <IconImages class="size-4 scale-x-[-1]" />
          </CodeActionButton>
          <CodeActionButton onClick={onCopy} label="Copy code">
            <IconCopy class="size-4 scale-x-[-1] scale-y-[-1]" />
          </CodeActionButton>
        </div>
      </div>
      <CodeHighlighter code={props.code} language={props.language} />
    </div>
  );
};

interface CodeActionButtonProps {
  onClick: () => void;
  label: string;
  isCopied?: boolean;
}

const CodeActionButton: ParentComponent<CodeActionButtonProps> = (props) => {
  return (
    <Button
      variant="secondary"
      size="icon"
      class={[
        'flex size-7 items-center justify-center p-0.5 text-xs',
        // 'focus-visible:ring-1 focus-visible:ring-slate-700 focus-visible:ring-offset-0',
        'screenshot-hide active:scale-90',
        'hover:bg-background-3',
      ].join(' ')}
      onClick={props.onClick}
    >
      {props.children}
      <span class="sr-only">{props.label}</span>
    </Button>
  );
};
