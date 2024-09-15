import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

// cloudflare
if (process.env.CF_PAGES === '1') {
  process.env.VITE_GIT_BRANCH_NAME = process.env.CF_PAGES_BRANCH || 'unknown';
  process.env.VITE_GIT_COMMIT_HASH = process.env.CF_PAGES_COMMIT_SHA
    ? process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)
    : 'unknown';
} else {
  const branchName = execSync('git branch --show-current').toString().trimEnd();
  const commitHash = execSync('git rev-parse --short HEAD').toString().trimEnd();

  process.env.VITE_GIT_BRANCH_NAME = branchName;
  process.env.VITE_GIT_COMMIT_HASH = commitHash;
}

process.env.VITE_APP_BUILD_DATE = new Date().toISOString();
process.env.VITE_APP_VERSION = packageJson.version;
process.env.VITE_APP_LICENSE = packageJson.license;

export default defineConfig({
  plugins: [solid(), VitePWA({ registerType: 'autoUpdate' })],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
});
