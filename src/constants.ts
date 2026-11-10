export const OPENROUTER_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_KEYS_URL = 'https://openrouter.ai/keys';

// Theme ids match users' saved settings. System follows the operating system preference,
// and unknown ids fall back to it.
export const THEMES = [
  { id: 'system', label: 'System', className: 'theme-system', scheme: 'light dark' },
  { id: 'light', label: 'Light', className: 'theme-default', scheme: 'light' },
  { id: 'dark', label: 'Dark', className: 'theme-default-dark', scheme: 'dark' },
] as const;

export type Theme = (typeof THEMES)[number]['id'];

export function getTheme(id: string) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}

// How an incoming answer is shown. The first three show it a word, a sentence or a paragraph at a
// time, each once it is finished, and complete shows nothing until the whole answer is in. The
// ids are saved in users' settings, and unknown ids fall back to the default.
export const STREAM_DISPLAY_MODES = [
  { id: 'live', label: 'Words', description: 'Show each word as it arrives' },
  { id: 'sentences', label: 'Sentences', description: 'Show each sentence once it is done' },
  { id: 'paragraphs', label: 'Paragraphs', description: 'Show each paragraph once it is done' },
  {
    id: 'complete',
    label: 'When finished',
    description: 'Show the answer once it is complete',
  },
] as const;

export type StreamDisplayMode = (typeof STREAM_DISPLAY_MODES)[number]['id'];

export const DEFAULT_STREAM_DISPLAY: StreamDisplayMode = 'paragraphs';

export function getStreamDisplayMode(id: unknown) {
  return (
    STREAM_DISPLAY_MODES.find((mode) => mode.id === id) ??
    STREAM_DISPLAY_MODES.find((mode) => mode.id === DEFAULT_STREAM_DISPLAY)!
  );
}

// What marks the spot where an answer is about to appear. Dots are the loader shown before the
// first text. The other two are a cursor that stays at the end of the text while it streams. The
// ids are saved in users' settings, and unknown ids fall back to the default.
export const STREAM_CURSORS = [
  { id: 'dots', label: 'Dots', description: 'Three dots, until the text starts' },
  { id: 'square', label: 'Square', description: 'A blinking block, as in a terminal' },
  { id: 'circle', label: 'Circle', description: 'A pulsing dot' },
] as const;

export type StreamCursorId = (typeof STREAM_CURSORS)[number]['id'];

export const DEFAULT_STREAM_CURSOR: StreamCursorId = 'square';

export function getStreamCursor(id: unknown) {
  return (
    STREAM_CURSORS.find((cursor) => cursor.id === id) ??
    STREAM_CURSORS.find((cursor) => cursor.id === DEFAULT_STREAM_CURSOR)!
  );
}
