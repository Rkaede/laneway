import { afterAll, beforeEach, describe, expect, it, mock } from 'bun:test';

import { confirmDialogDismiss } from './dialog-dismiss';

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const confirm = mock(() => false);
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: { confirm },
});

beforeEach(() => confirm.mockReset().mockReturnValue(false));
afterAll(() => {
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

describe('confirmDialogDismiss', () => {
  it('allows an unchanged draft to close without confirmation', () => {
    const event = new Event('dismiss', { cancelable: true });
    confirmDialogDismiss(event, false);
    expect(event.defaultPrevented).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('keeps unsaved changes when discarding is declined', () => {
    const event = new Event('dismiss', { cancelable: true });
    confirmDialogDismiss(event, true);
    expect(event.defaultPrevented).toBe(true);
    expect(confirm).toHaveBeenCalledWith('Discard unsaved changes?');
  });

  it('allows unsaved changes to be discarded after confirmation', () => {
    confirm.mockReturnValue(true);
    const event = new Event('dismiss', { cancelable: true });
    confirmDialogDismiss(event, true);
    expect(event.defaultPrevented).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(1);
  });
});
