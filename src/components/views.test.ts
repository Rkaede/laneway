import { describe, expect, it } from 'bun:test';

// Views take everything through props, so the sandbox can render every state of them without
// touching saved data. The connected wrapper beside each one holds the store and service calls.
const views = [
  './chat/components/message-view.tsx',
  './connected/api-key-dialog-view.tsx',
  './connected/api-key-form-view.tsx',
  './connected/app-error-view.tsx',
  './connected/speed-dial-view.tsx',
];

const stories = [
  ['../routes/sandbox/api-key-form.stories.tsx', /connected\/api-key-(form|dialog|request)'/],
  ['../routes/sandbox/app-error.stories.tsx', /connected\/app-error'/],
  ['../routes/sandbox/message.stories.tsx', /chat\/components(\/message)?'/],
  ['../routes/sandbox/speed-dial.stories.tsx', /connected\/speed-dial'/],
] as const;

// Type-only imports are erased from the bundle, so they cannot reach the store or a service.
const valueImports = (source: string) =>
  [...source.matchAll(/^import (?!type )[^;]*? from '([^']+)';$/gms)].map((match) => match[1]);

describe('view components', () => {
  it.each(views)('%s does not import the store, hooks or services', async (path) => {
    const source = await Bun.file(new URL(path, import.meta.url)).text();

    expect(valueImports(source).length).toBeGreaterThan(0);
    expect(
      valueImports(source).filter((name) => /^~\/(store|hooks|services)\b/.test(name)),
    ).toEqual([]);
  });

  it.each(stories)('%s renders the view, not the connected wrapper', async (path, wrapper) => {
    const source = await Bun.file(new URL(path, import.meta.url)).text();

    expect(source).not.toMatch(wrapper);
    expect(source).not.toMatch(/from '~\/store'/);
  });
});
