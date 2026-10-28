import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import type { Mock } from 'bun:test';
import { afterAll, afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import { imageCache } from '~/services/image-cache';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);

// Compile without a DOM, but use client reactivity to exercise source changes and cleanup.
const source = await Bun.file(new URL('./local-image.tsx', import.meta.url)).text();
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile LocalImage');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const directory = await mkdtemp(join(tmpdir(), 'laneway-local-image-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const filename = join(directory, 'local-image.mjs');
await Bun.write(filename, code);
const { LocalImage }: typeof import('./local-image') = await import(filename);

let dispose: () => void;
let createUrl: Mock<typeof URL.createObjectURL>;
let revokeUrl: Mock<typeof URL.revokeObjectURL>;
let getImage: Mock<typeof imageCache.get>;

function setup(props: Parameters<typeof LocalImage>[0]) {
  const image = solid.createRoot((cleanup) => {
    dispose = cleanup;
    return LocalImage(props);
  });
  return () => renderToString(() => image);
}

beforeEach(() => {
  dispose = () => {};
  createUrl = spyOn(URL, 'createObjectURL').mockReturnValue('blob:image');
  revokeUrl = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  getImage = spyOn(imageCache, 'get').mockResolvedValue(new Blob(['image']));
});

afterEach(() => {
  dispose();
  mock.restore();
});

describe('LocalImage availability', () => {
  it('recovers from missing images on each source change', async () => {
    getImage.mockResolvedValueOnce(null);
    const [src, setSrc] = solid.createSignal('missing.png');
    const render = setup({
      get src() {
        return src();
      },
    });
    await Promise.resolve();
    expect(render()).toContain('Image not found');

    setSrc('photo.png');
    await Promise.resolve();
    expect(render()).toContain('src="blob:image"');
    expect(render()).not.toContain('Image not found');

    const pending = Promise.withResolvers<Blob | null>();
    getImage.mockReturnValueOnce(pending.promise);
    setSrc('missing-again.png');
    expect(render()).toContain('src=""');
    pending.resolve(null);
    await Promise.resolve();
    expect(render()).toContain('Image not found');

    setSrc('photo.png');
    await Promise.resolve();
    expect(render()).toContain('src="blob:image"');
    expect(render()).not.toContain('Image not found');
  });

  it('recovers when switching from a missing cached image to a direct path', async () => {
    getImage.mockResolvedValueOnce(null);
    const [sourceType, setSourceType] = solid.createSignal<'store' | 'path'>('store');
    const render = setup({
      src: 'photo.png',
      get sourceType() {
        return sourceType();
      },
    });
    await Promise.resolve();
    expect(render()).toContain('Image not found');

    setSourceType('path');
    expect(render()).toContain('src="photo.png"');
    expect(render()).not.toContain('Image not found');
    expect(getImage).toHaveBeenCalledTimes(1);
  });

  it('ignores a stale cache miss after a newer source has loaded', async () => {
    const pending = Promise.withResolvers<Blob | null>();
    getImage.mockReturnValueOnce(pending.promise);
    const [src, setSrc] = solid.createSignal('missing.png');
    const render = setup({
      get src() {
        return src();
      },
    });

    setSrc('photo.png');
    await Promise.resolve();
    pending.resolve(null);
    await Promise.resolve();

    expect(render()).toContain('src="blob:image"');
    expect(render()).not.toContain('Image not found');
  });
});

describe('LocalImage object URLs', () => {
  it('revokes each cached URL when the source changes and on unmount', async () => {
    const [src, setSrc] = solid.createSignal('first.png');
    createUrl.mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    setup({
      get src() {
        return src();
      },
    });
    await Promise.resolve();

    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(revokeUrl).not.toHaveBeenCalled();

    setSrc('second.png');
    expect(revokeUrl.mock.calls).toEqual([['blob:first']]);
    await Promise.resolve();

    expect(getImage.mock.calls).toEqual([['/first.png'], ['/second.png']]);
    expect(createUrl).toHaveBeenCalledTimes(2);
    dispose();
    expect(revokeUrl.mock.calls).toEqual([['blob:first'], ['blob:second']]);
  });

  it('revokes the cached URL when switching to a direct path', async () => {
    const [sourceType, setSourceType] = solid.createSignal<'store' | 'path'>('store');
    setup({
      src: 'photo.png',
      get sourceType() {
        return sourceType();
      },
    });
    await Promise.resolve();

    setSourceType('path');
    dispose();

    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(revokeUrl.mock.calls).toEqual([['blob:image']]);
    expect(getImage).toHaveBeenCalledTimes(1);
  });

  it('does not create or revoke URLs for direct paths', () => {
    setup({ src: '/photo.png', sourceType: 'path' });
    dispose();

    expect(getImage).not.toHaveBeenCalled();
    expect(createUrl).not.toHaveBeenCalled();
    expect(revokeUrl).not.toHaveBeenCalled();
  });

  it('does not create a URL when a cache read completes after unmount', async () => {
    const pending = Promise.withResolvers<Blob | null>();
    getImage.mockReturnValueOnce(pending.promise);
    setup({ src: 'photo.png' });
    dispose();

    pending.resolve(new Blob(['image']));
    await Promise.resolve();

    expect(createUrl).not.toHaveBeenCalled();
    expect(revokeUrl).not.toHaveBeenCalled();
  });

  it('ignores a stale cache read after a newer source has loaded', async () => {
    const pending = Promise.withResolvers<Blob | null>();
    const current = new Blob(['current']);
    getImage.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(current);
    const [src, setSrc] = solid.createSignal('old.png');
    setup({
      get src() {
        return src();
      },
    });

    setSrc('current.png');
    await Promise.resolve();
    pending.resolve(new Blob(['old']));
    await Promise.resolve();

    expect(createUrl.mock.calls).toEqual([[current]]);
    expect(revokeUrl).not.toHaveBeenCalled();
    dispose();
    expect(revokeUrl.mock.calls).toEqual([['blob:image']]);
  });

  it('does not create a URL for a missing cached image', async () => {
    getImage.mockResolvedValueOnce(null);
    setup({ src: 'missing.png' });
    await Promise.resolve();
    dispose();

    expect(createUrl).not.toHaveBeenCalled();
    expect(revokeUrl).not.toHaveBeenCalled();
  });
});
