import type { Component } from 'solid-js';

import { deleteData } from '~/store';
import { announceDataReplaced, exportAllData } from '~/store/database';

import { AppErrorView } from './app-error-view';

export const AppError: Component = () => {
  const handleClearData = () => {
    if (deleteData()) {
      announceDataReplaced();
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    try {
      const omittedImages = await exportAllData();
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
