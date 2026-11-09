import { describe, expect, it, mock } from 'bun:test';

import { openPreviewOnKey } from './thumbnail-keys';

const thumbnail = {};
const removeButton = {};

function press(key: string, target: object) {
  const preventDefault = mock(() => {});
  const openPreview = mock(() => {});
  const event = { key, target, currentTarget: thumbnail, preventDefault };
  openPreviewOnKey(event as unknown as KeyboardEvent, openPreview);
  return { preventDefault, openPreview };
}

describe('openPreviewOnKey', () => {
  it('opens the preview for Enter on the thumbnail', () => {
    const { openPreview, preventDefault } = press('Enter', thumbnail);

    expect(openPreview).toHaveBeenCalledTimes(1);
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('opens the preview for Space on the thumbnail without scrolling the page', () => {
    const { openPreview, preventDefault } = press(' ', thumbnail);

    expect(openPreview).toHaveBeenCalledTimes(1);
    expect(preventDefault).toHaveBeenCalledTimes(1);
  });

  it.each(['Enter', ' '])('leaves %j on the Remove button to that button', (key) => {
    const { openPreview, preventDefault } = press(key, removeButton);

    expect(openPreview).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });

  it.each(['Tab', 'Escape', 'a'])('ignores %j', (key) => {
    const { openPreview, preventDefault } = press(key, thumbnail);

    expect(openPreview).not.toHaveBeenCalled();
    expect(preventDefault).not.toHaveBeenCalled();
  });
});
