export const OPENROUTER_URL = 'https://openrouter.ai/api/v1';

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
