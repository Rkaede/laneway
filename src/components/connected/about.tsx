import { type Component, Show } from 'solid-js';

import { IconCheck, IconCopy, IconInfo } from '~/components/icons/ui';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '~/components/ui';
import { useCopyToClipboard } from '~/hooks/use-copy';
import { setStore, store } from '~/store';

const About: Component = () => {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });

  const closeDialog = () => {
    setStore('dialogs', 'about', 'open', false);
  };

  const buildInfo = {
    branch: import.meta.env.VITE_GIT_BRANCH_NAME,
    date: new Date(import.meta.env.VITE_APP_BUILD_DATE).toLocaleString(),
    hash: import.meta.env.VITE_GIT_COMMIT_HASH,
    version: import.meta.env.VITE_APP_VERSION,
    license: 'MIT License',
  };

  function copyBuildInfo() {
    const info = Object.entries(buildInfo)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    copyToClipboard(info);
  }

  return (
    <Dialog open={store.dialogs.about.open} onOpenChange={closeDialog}>
      <DialogContent class="max-w-xs">
        <DialogHeader>
          <DialogTitle class="flex items-center gap-2">
            <IconInfo class="h-5 w-5" />
            Laneway
          </DialogTitle>
        </DialogHeader>
        <div class="mx-0 inline-grid grid-cols-[auto_1fr] items-center gap-2 py-4">
          <span class="text-right text-sm font-medium">Branch:</span>
          <span class="text-sm">{buildInfo.branch}</span>
          <span class="text-right text-sm font-medium">Date:</span>
          <span class="text-sm">{buildInfo.date}</span>
          <span class="text-right text-sm font-medium">Hash:</span>
          <span class="text-sm">{buildInfo.hash}</span>
          <span class="text-right text-sm font-medium">Version:</span>
          <span class="text-sm">{buildInfo.version}</span>
          <span class="text-right text-sm font-medium">License:</span>
          <span class="text-sm">{buildInfo.license}</span>
        </div>
        <div class="flex justify-end gap-2">
          <Button onClick={copyBuildInfo} variant="outline">
            <Show
              when={isCopied()}
              fallback={
                <>
                  <IconCopy class="mr-2 h-4 w-4" />
                  Copy build info
                </>
              }
            >
              <IconCheck class="mr-2 h-4 w-4" />
              Copied!
            </Show>
          </Button>
          <Button onClick={closeDialog} variant="outline">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default About;
