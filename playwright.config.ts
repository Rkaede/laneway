import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: {
    command: 'pnpm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
