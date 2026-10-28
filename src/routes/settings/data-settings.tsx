import { createSignal } from 'solid-js';

import { Button } from '~/components/ui';
import { showSuccess } from '~/components/ui/notifications';
import { deleteData, setStore, store } from '~/store';
import { exportBackup, parseBackup, restoreBackup } from '~/store/backup';
import { deleteKeys } from '~/store/keys';

import { Section, Setting } from './shared';

export function Data() {
  const [busy, setBusy] = createSignal(false);
  const [error, setError] = createSignal('');
  const [status, setStatus] = createSignal('');
  let fileInput!: HTMLInputElement;

  async function exportData() {
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const omittedImages = await exportBackup(store);
      setStatus(
        omittedImages
          ? `Data exported. ${omittedImages} unavailable image${omittedImages === 1 ? '' : 's'} left out.`
          : 'Data exported.',
      );
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to export data.');
    } finally {
      setBusy(false);
    }
  }

  async function importData(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    setStatus('');
    try {
      const backup = parseBackup(await file.text());
      if (
        !window.confirm(
          'Replace your chats, notes, images, assistants, presets, and settings with this backup? This cannot be undone. Export your current data first if you need it. API keys will be kept.' +
            (backup.legacy ? '\n\nThis older export does not include image files.' : ''),
        )
      )
        return;
      await restoreBackup(backup, store, setStore);
      showSuccess('Data imported.');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to import data.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section title="Data" description="All data is stored locally in your browser.">
      <Setting
        inline
        title="Delete Data"
        description="Removes all data from your browser except for the API keys."
      >
        <div class="flex justify-end">
          <Button
            variant="destructive"
            disabled={busy()}
            onClick={() => {
              if (deleteData()) showSuccess('Data deleted.');
            }}
          >
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
          <Button
            variant="destructive"
            disabled={busy()}
            onClick={() => {
              deleteKeys();
              showSuccess('API keys deleted.');
            }}
          >
            Delete Keys
          </Button>
        </div>
      </Setting>
      <Setting
        inline
        title="Export Data"
        description="Back up chats, notes, images, and settings. API keys are excluded."
      >
        <div class="flex justify-end">
          <Button variant="outline" disabled={busy()} onClick={exportData}>
            Export Data
          </Button>
        </div>
      </Setting>
      <Setting
        inline
        title="Import Data"
        description="Replace your data with a backup file. API keys are kept."
      >
        <div class="flex justify-end">
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="Backup file"
            class="hidden"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              event.currentTarget.value = '';
              void importData(file);
            }}
          />
          <Button variant="outline" disabled={busy()} onClick={() => fileInput.click()}>
            Import Data
          </Button>
        </div>
      </Setting>
      {error() && (
        <p role="alert" class="text-sm text-danger">
          {error()}
        </p>
      )}
      {status() && (
        <p role="status" class="text-sm text-muted">
          {status()}
        </p>
      )}
    </Section>
  );
}
