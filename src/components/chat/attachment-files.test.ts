import { describe, expect, it } from 'bun:test';

import config from '~/config';

import { validateAttachmentFiles } from './attachment-files';

describe('attachment files', () => {
  it.each([
    ['photo.png', 'image/png'],
    ['photo.jpg', 'image/jpeg'],
    ['photo.jpeg', 'image/jpeg'],
    ['photo.gif', 'image/gif'],
    ['photo.webp', 'image/webp'],
  ])('accepts supported image %s', (name, type) => {
    const file = new File(['image'], name, { type });

    expect(validateAttachmentFiles([file])).toEqual({ files: [file], errors: [] });
  });

  it('keeps every valid file in order and reports each rejected file in a mixed batch', () => {
    const first = new File(['image'], 'first.png', { type: 'image/png' });
    const text = new File(['text'], 'notes.txt', { type: 'text/plain' });
    const second = new File(['image'], 'second.webp', { type: 'image/webp' });
    const svg = new File(['<svg/>'], 'drawing.svg', { type: 'image/svg+xml' });

    expect(validateAttachmentFiles([first, text, second, svg])).toEqual({
      files: [first, second],
      errors: [
        'notes.txt: unsupported file type. Use PNG, JPEG, GIF or WebP.',
        'drawing.svg: unsupported file type. Use PNG, JPEG, GIF or WebP.',
      ],
    });
  });

  it.each(['text/plain', ''])('rejects an image extension with type %j', (type) => {
    const file = new File(['text'], 'photo.png', { type });

    expect(validateAttachmentFiles([file])).toEqual({
      files: [],
      errors: ['photo.png: unsupported file type. Use PNG, JPEG, GIF or WebP.'],
    });
  });

  it('accepts the size limit and rejects larger images without discarding valid files', () => {
    const boundary = new File([new Uint8Array(config.attachments.maxSize)], 'boundary.png', {
      type: 'image/png',
    });
    const oversized = new File(
      [new Uint8Array(config.attachments.maxSize + 1)],
      'oversized.png',
      { type: 'image/png' },
    );

    expect(validateAttachmentFiles([oversized, boundary])).toEqual({
      files: [boundary],
      errors: ['oversized.png: image is too large. Maximum size is 10 MiB per image.'],
    });
  });

  it('leaves an empty selection unchanged', () => {
    expect(validateAttachmentFiles([])).toEqual({ files: [], errors: [] });
  });
});
