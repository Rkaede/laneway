export function removeLegacyGoogleKey<T extends object>(keys: T): Omit<T, 'google'> {
  const currentKeys: T & { google?: unknown } = { ...keys };
  delete currentKeys.google;
  return currentKeys;
}
