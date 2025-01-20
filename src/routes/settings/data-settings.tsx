import { Button } from '~/components/ui';
import { deleteData, store } from '~/store';
import { deleteKeys } from '~/store/keys';
import { download } from '~/util';

import { Section, Setting } from './shared';

export function Data() {
  return (
    <Section title="Data" description="All data is stored locally in your browser.">
      <Setting
        inline
        title="Delete Data"
        description="Removes all data from your browser except for the API keys."
      >
        <div class="flex justify-end">
          <Button variant="destructive" onClick={() => deleteData()}>
            Delete Data
          </Button>
        </div>
      </Setting>
      <Setting
        inline
        title="Delete API Keys"
        description="Removes the API keys from your browser."
      >
        <div class="flex justify-end">
          <Button variant="destructive" onClick={() => deleteKeys()}>
            Delete Keys
          </Button>
        </div>
      </Setting>
      <Setting inline title="Export Data" description="Backup all your data to a file.">
        <div class="flex justify-end">
          <Button
            variant="outline"
            onClick={() => download(JSON.stringify(store), 'chat-data.json')}
          >
            Export Data
          </Button>
        </div>
      </Setting>
    </Section>
  );
}
