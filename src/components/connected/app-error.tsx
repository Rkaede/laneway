import type { Component } from 'solid-js';

import { deleteData, store } from '~/store';
import { exportBackup } from '~/store/backup';

import { AppErrorView } from './app-error-view';

export const AppError: Component = () => {
  const handleClearData = () => {
    if (deleteData()) {
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    try {
      const omittedImages = await exportBackup(store);
      if (omittedImages) {
        window.alert(
          `Data exported. ${omittedImages} unavailable image${omittedImages === 1 ? '' : 's'} left out.`,
        );
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Unable to export data.');
    }
  };

  return (
    <AppErrorView
      onReload={() => window.location.reload()}
      onExport={handleExportData}
      onClear={handleClearData}
    />
  );
};
