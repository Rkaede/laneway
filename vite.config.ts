import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import solid from 'vite-plugin-solid';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));

// cloudflare
if (process.env.CF_PAGES === '1') {
  process.env.VITE_GIT_BRANCH_NAME = process.env.CF_PAGES_BRANCH || 'unknown';
  process.env.VITE_GIT_COMMIT_HASH = process.env.CF_PAGES_COMMIT_SHA
    ? process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)
    : 'unknown';
} else {
  try {
    const branchName = execSync('git branch --show-current', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trimEnd();
    const commitHash = execSync('git rev-parse --short HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trimEnd();

    process.env.VITE_GIT_BRANCH_NAME = branchName || 'unknown';
    process.env.VITE_GIT_COMMIT_HASH = commitHash;
  } catch {
    process.env.VITE_GIT_BRANCH_NAME = 'unknown';
    process.env.VITE_GIT_COMMIT_HASH = 'unknown';
  }
}

process.env.VITE_APP_BUILD_DATE = new Date().toISOString();
process.env.VITE_APP_VERSION = packageJson.version;

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Laneway',
        short_name: 'Laneway',
        description: 'Chat with multiple AI providers from a browser-only app.',
        theme_color: '#2783eb',
        background_color: '#fafafa',
        start_url: '/',
        display: 'standalone',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
  optimizeDeps: {
    // Add both @codemirror/state and @codemirror/view to included deps to optimize
    include: [
      '@codemirror/state',
      '@codemirror/view',
      'solid-markdown > micromark',
      'solid-markdown > unified',
    ],
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    // Let only the current Tailscale preview hostname through Vite's host check.
    allowedHosts: process.env.PORTLESS_TAILSCALE_URL
      ? [new URL(process.env.PORTLESS_TAILSCALE_URL).hostname]
      : [],
  },
});
