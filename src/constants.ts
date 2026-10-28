export const OPENROUTER_URL = 'https://openrouter.ai/api/v1';

// Each theme maps to a theme class, mounted on <html> by the app layout. The ids match the
// values saved in users' settings, and unknown ids fall back to the first theme.
export const THEMES = [
  { id: 'light', label: 'Light', className: 'theme-default', scheme: 'light' },
  { id: 'dark', label: 'Dark', className: 'theme-default-dark', scheme: 'dark' },
] as const;

export type Theme = (typeof THEMES)[number]['id'];

export function getTheme(id: string) {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
