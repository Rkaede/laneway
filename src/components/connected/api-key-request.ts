import { createSignal } from 'solid-js';

// Plain-TypeScript entry point for asking for a key, so hooks and actions can open the key
// dialog without importing the component. The mounted <ApiKeyDialog /> reads this signal.
const [apiKeyRequest, setApiKeyRequest] = createSignal<{ onSaved?: () => void }>();

export { apiKeyRequest, setApiKeyRequest };

/**
 * Opens the key dialog. `onSaved` runs once a key is saved, so a message that was blocked for
 * want of a key can be sent straight away.
 */
export function requestApiKey(onSaved?: () => void) {
  setApiKeyRequest({ onSaved });
}
