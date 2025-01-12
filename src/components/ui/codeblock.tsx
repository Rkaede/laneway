import { toBlob, toPng } from 'html-to-image';
import { type Component, createSignal } from 'solid-js';

import { useCopyToClipboard } from '~/hooks/use-copy';
import { downloadFile, filenameDate } from '~/util';

import {
  IconCopy,
  IconDownload,
  IconImageDownload,
  IconImages,
  MoreHorizontalIcon,
} from '../icons/ui';
import { Button } from './button';
import { CodeHighlighter } from './code-highlighter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown';

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

  const unsanitizedCode = () => props.code.replaceAll('&lt;', '<').replaceAll('&gt;', '>');

  function downloadAsFile() {
    if (typeof window === 'undefined') {
      return;
    }
    const fileExtension = programmingLanguages[props.language] || '.txt';
    const filename = filenameDate() + fileExtension;

    const blob = new Blob([unsanitizedCode()], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, filename);
    URL.revokeObjectURL(url);
  }

  function onCopy() {
    if (isCopied()) return;
    copyToClipboard(unsanitizedCode());
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
    <div class="codeblock group/toolbar w-full rounded bg-gray-700/80 font-sans" ref={ref}>
      <div class="flex w-full items-center justify-between px-4 py-0.5 pr-2 text-gray-100">
        <span class="text-xs font-medium lowercase">{props.language}</span>
        <div class="flex items-center gap-1">
          <CodeActionDropdown
            onCopy={onCopy}
            onDownload={downloadAsFile}
            onCopyScreenshot={onCopyScreenshot}
            onDownloadScreenshot={onDownloadScreenshot}
          />
        </div>
      </div>
      <CodeHighlighter code={unsanitizedCode()} language={props.language} />
    </div>
  );
};

function CodeActionDropdown(props: {
  sessionId?: string;
  onCopy: () => void;
  onDownload: () => void;
  onCopyScreenshot: () => void;
  onDownloadScreenshot: () => void;
}) {
  const [open, setOpen] = createSignal(false);
  return (
    <DropdownMenu open={open()} onOpenChange={(o) => setOpen(o)}>
      <DropdownMenuTrigger
        as={Button}
        class="flex size-6 items-center justify-center rounded-md p-0 transition-none hover:bg-background-4 data-[open='true']:opacity-100"
        data-open={open()}
        variant="ghost"
        size="icon"
        aria-label="Code actions"
      >
        <MoreHorizontalIcon class="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={props.onDownloadScreenshot}>
            <IconImageDownload class="mr-2 size-4" />
            Download Screenshot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={props.onDownload}>
            <IconDownload class="mr-2 size-4" />
            Download File
          </DropdownMenuItem>
          <DropdownMenuItem onClick={props.onCopyScreenshot}>
            <IconImages class="mr-2 size-4 scale-x-[-1]" />
            Copy Screenshot
          </DropdownMenuItem>
          <DropdownMenuItem onClick={props.onCopy}>
            <IconCopy class="mr-2 size-4 scale-x-[-1] scale-y-[-1]" />
            Copy Code
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
