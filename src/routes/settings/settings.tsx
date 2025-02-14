import { PageTitle, SectionDescription } from '~/components/ui/forms';
import { store } from '~/store';

import { APIKeySetting } from './api-key-settings';
import { Completions } from './completion-settings';
import { Data } from './data-settings';
import { GeneralSettings } from './general-settings';
import { SpeedDial } from './speed-dial-settings';
import { TTSSettings } from './tts-settings';

export default function Settings() {
  return (
    <div class="h-full overflow-auto px-10 py-6">
      <div class="container mx-auto grid max-w-screen-md gap-16 pb-24">
        <div>
          <PageTitle>Settings</PageTitle>
          <SectionDescription>
            Configure API keys, preferences, and data management options
          </SectionDescription>
          <hr class="mt-4" />
        </div>
        <GeneralSettings />
        {store.featureFlags.completions && <Completions />}
        <TTSSettings />
        <APIKeySetting />
        <SpeedDial />
        <Data />
      </div>
    </div>
  );
}
