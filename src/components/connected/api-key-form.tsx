import { createSignal, type JSX } from 'solid-js';

import { showSuccess } from '~/components/ui/notify';
import { checkApiKey, detectKeyKind } from '~/services/api-keys';
import { apiKeys, setApiKey } from '~/store/keys';

import { type ApiKeyFormStatus, ApiKeyFormView } from './api-key-form-view';

/**
 * The OpenRouter key form. It checks the key with OpenRouter before saving it, and turns away
 * OpenAI keys, which Laneway no longer uses. `ApiKeyFormView` draws it.
 */
export function ApiKeyForm(props: {
  onSaved: () => void;
  submitLabel?: string;
  hint?: JSX.Element;
  hideLabel?: boolean;
  class?: string;
}) {
  const [value, setValue] = createSignal('');
  const [status, setStatus] = createSignal<ApiKeyFormStatus>('idle');

  async function handleSubmit() {
    const key = value();
    setStatus('checking');
    const result = await checkApiKey(key);
    // The field stays editable during the check. An edit has already reset the status, and the
    // result no longer describes what the field holds.
    if (value() !== key) return;
    if (result === 'invalid') {
      setStatus('invalid');
      return;
    }

    setApiKey(key);
    setStatus('idle');
    showSuccess('OpenRouter key saved.');
    props.onSaved();
  }

  return (
    <ApiKeyFormView
      value={value()}
      keyKind={detectKeyKind(value())}
      status={status()}
      openaiKeyRemoved={apiKeys.openaiKeyRemoved}
      onInput={(next) => {
        setValue(next);
        setStatus('idle');
      }}
      onSubmit={handleSubmit}
      submitLabel={props.submitLabel}
      hint={props.hint}
      hideLabel={props.hideLabel}
      class={props.class}
    />
  );
}
