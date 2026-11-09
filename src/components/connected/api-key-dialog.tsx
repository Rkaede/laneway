import { ApiKeyDialogView, KeyNoticeView } from './api-key-dialog-view';
import { ApiKeyForm } from './api-key-form';
import { apiKeyRequest, requestApiKey, setApiKeyRequest } from './api-key-request';

export function ApiKeyDialog() {
  function handleSaved() {
    const onSaved = apiKeyRequest()?.onSaved;
    setApiKeyRequest(undefined);
    onSaved?.();
  }

  return (
    <ApiKeyDialogView
      open={apiKeyRequest() !== undefined}
      onOpenChange={(open) => !open && setApiKeyRequest(undefined)}
    >
      <ApiKeyForm
        submitLabel={apiKeyRequest()?.onSaved ? 'Save and send' : 'Save key'}
        onSaved={handleSaved}
      />
    </ApiKeyDialogView>
  );
}

/** A line for the composer while no key is set. */
export function KeyNotice(props: { class?: string }) {
  return <KeyNoticeView class={props.class} onAddKey={() => requestApiKey()} />;
}
