import { afterEach, expect, it } from 'bun:test';
import { loadConfigFromFile } from 'vite';

const tailscaleUrl = process.env.PORTLESS_TAILSCALE_URL;

afterEach(() => {
  if (tailscaleUrl === undefined) {
    delete process.env.PORTLESS_TAILSCALE_URL;
  } else {
    process.env.PORTLESS_TAILSCALE_URL = tailscaleUrl;
  }
});

async function loadAllowedHosts() {
  const result = await loadConfigFromFile(
    { command: 'serve', mode: 'development' },
    `${import.meta.dir}/vite.config.ts`,
    import.meta.dir,
    'silent',
  );

  expect(result).not.toBeNull();
  return result?.config.server?.allowedHosts;
}

it('does not allow additional hosts without a Tailscale preview URL', async () => {
  delete process.env.PORTLESS_TAILSCALE_URL;

  expect(await loadAllowedHosts()).toEqual([]);
});

it('allows only the current Tailscale preview hostname', async () => {
  process.env.PORTLESS_TAILSCALE_URL = 'https://laneway.tail123.ts.net:8443';

  expect(await loadAllowedHosts()).toEqual(['laneway.tail123.ts.net']);
});
