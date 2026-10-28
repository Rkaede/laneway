import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

import { describe, expect, it } from 'bun:test';

import { applyTheme } from './use-theme';

function createTarget(prefersDark: boolean) {
  const classes = new Set(['unrelated']);
  const root = {
    classList: {
      add: (name: string) => classes.add(name),
      remove: (...names: string[]) => names.forEach((name) => classes.delete(name)),
    },
    style: { colorScheme: '' },
  } as unknown as HTMLElement;
  const preference = Object.assign(new EventTarget(), {
    matches: prefersDark,
  }) as MediaQueryList;
  return { classes, root, preference };
}

const themes = [
  ['system', true, 'dark'],
  ['system', false, 'light'],
  ['unknown', true, 'dark'],
  ['unknown', false, 'light'],
  ['light', true, 'light'],
  ['dark', false, 'dark'],
] as const;

function expectTheme(target: ReturnType<typeof createTarget>, scheme: string) {
  expect([...target.classes]).toEqual([
    'unrelated',
    scheme === 'dark' ? 'theme-default-dark' : 'theme-default',
  ]);
  expect(target.root.style.colorScheme).toBe(scheme);
}

describe('applyTheme', () => {
  it.each(themes)('applies %s with dark OS preference %s as %s', (id, dark, scheme) => {
    const target = createTarget(dark);
    target.classes.add('theme-default').add('theme-default-dark').add('theme-system');
    const cleanup = applyTheme(id, target.root, target.preference);

    expectTheme(target, scheme);
    cleanup();
  });

  it('follows OS changes and removes the listener on cleanup', () => {
    const target = createTarget(false);
    const cleanup = applyTheme('system', target.root, target.preference);

    Object.assign(target.preference, { matches: true });
    target.preference.dispatchEvent(new Event('change'));
    expectTheme(target, 'dark');

    Object.assign(target.preference, { matches: false });
    target.preference.dispatchEvent(new Event('change'));
    expectTheme(target, 'light');

    cleanup();
    Object.assign(target.preference, { matches: true });
    target.preference.dispatchEvent(new Event('change'));
    expectTheme(target, 'light');
  });

  it.each(['light', 'dark'])('keeps an explicit %s theme when the OS changes', (id) => {
    const target = createTarget(false);
    const cleanup = applyTheme(id, target.root, target.preference);

    Object.assign(target.preference, { matches: true });
    target.preference.dispatchEvent(new Event('change'));
    expectTheme(target, id);
    cleanup();
  });

  it('replaces the previous preference listener when the theme changes', () => {
    const target = createTarget(false);
    const cleanup = applyTheme('system', target.root, target.preference);
    cleanup();
    const cleanupDark = applyTheme('dark', target.root, target.preference);

    target.preference.dispatchEvent(new Event('change'));
    expectTheme(target, 'dark');
    cleanupDark();
  });
});

describe('theme before app startup', () => {
  const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
  const script = readFileSync(new URL('../../public/theme-init.js', import.meta.url), 'utf8');

  it('uses only external scripts allowed by the production CSP', () => {
    const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    expect(scripts.length).toBeGreaterThan(0);
    for (const [, attributes, body] of scripts) {
      expect(attributes).toMatch(/\bsrc=["'][^"']+["']/);
      expect(body.trim()).toBe('');
    }
  });

  it('loads the theme initializer synchronously in the document head', () => {
    const head = html.match(/<head>([\s\S]*?)<\/head>/)![1];
    expect(head).toContain('<script src="/theme-init.js"></script>');
  });

  function initialize(storage: { getItem: (key: string) => string | null }, dark: boolean) {
    const target = createTarget(dark);
    runInNewContext(script, {
      document: { documentElement: target.root },
      localStorage: storage,
      window: {
        matchMedia: (query: string) => {
          expect(query).toBe('(prefers-color-scheme: dark)');
          return target.preference;
        },
      },
    });
    return target;
  }

  it.each(themes)(
    'applies saved %s with dark OS preference %s as %s',
    (theme, dark, scheme) => {
      const target = initialize(
        {
          getItem: (key) => {
            expect(key).toBe('chat-store');
            return JSON.stringify({ settings: { theme } });
          },
        },
        dark,
      );

      expectTheme(target, scheme);
    },
  );

  it.each([null, '{}', '{"settings":{}}', 'invalid JSON'])(
    'uses the OS when stored settings are %p',
    (stored) => {
      for (const dark of [false, true]) {
        const target = initialize({ getItem: () => stored }, dark);
        expectTheme(target, dark ? 'dark' : 'light');
      }
    },
  );

  it('uses the OS when storage access is denied', () => {
    const target = initialize(
      {
        getItem: () => {
          throw new Error('Storage unavailable');
        },
      },
      true,
    );

    expectTheme(target, 'dark');
  });
});
