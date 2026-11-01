type LegacyFields = { google?: unknown; openai?: unknown; hasCompletedWelcome?: unknown };

/**
 * Drops fields Laneway no longer uses: keys for providers it no longer calls directly and the
 * old welcome flag. A removed OpenAI key is flagged so the app can say why it is gone.
 */
export function removeLegacyKeys<T extends object>(
  keys: T,
): Omit<T, keyof LegacyFields> & { openaiKeyRemoved?: true } {
  const currentKeys: T & LegacyFields & { openaiKeyRemoved?: true } = { ...keys };
  if (typeof currentKeys.openai === 'string' && currentKeys.openai.trim()) {
    currentKeys.openaiKeyRemoved = true;
  }
  delete currentKeys.google;
  delete currentKeys.openai;
  delete currentKeys.hasCompletedWelcome;
  return currentKeys;
}
