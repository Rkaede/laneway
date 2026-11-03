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

// How an incoming answer is shown. Live shows text as it arrives, paragraphs holds text back until
// a paragraph is finished, and complete shows nothing until the whole answer is in. The ids are
// saved in users' settings, and unknown ids fall back to live.
export const STREAM_DISPLAY_MODES = [
  { id: 'live', label: 'Live', description: 'Show text as it arrives' },
  { id: 'paragraphs', label: 'Paragraphs', description: 'Show each paragraph once it is done' },
  {
    id: 'complete',
    label: 'When finished',
    description: 'Show the answer once it is complete',
  },
] as const;

export type StreamDisplayMode = (typeof STREAM_DISPLAY_MODES)[number]['id'];

export function getStreamDisplayMode(id: unknown) {
  return STREAM_DISPLAY_MODES.find((mode) => mode.id === id) ?? STREAM_DISPLAY_MODES[0];
}
