import { createSignal, onCleanup, Show } from 'solid-js';

import { ApiKeyDialogView, KeyNoticeView } from '~/components/connected/api-key-dialog-view';
import {
  type ApiKeyFormStatus,
  ApiKeyFormView,
} from '~/components/connected/api-key-form-view';
import { Button } from '~/components/ui/button';
import { detectKeyKind } from '~/services/api-keys';
import { noop } from '~/util';

import { Cell, CellHeader, Cells } from './story-components';

export function States() {
  return (
    <Cells class="max-w-lg">
      <Cell>
        <CellHeader>Empty</CellHeader>
        <ApiKeyFormView class="w-full" value="" onInput={noop} onSubmit={noop} />
      </Cell>
      <Cell>
        <CellHeader>OpenRouter key, ready to save</CellHeader>
        <ApiKeyFormView
          class="w-full"
          value="sk-or-example"
          keyKind="openrouter"
          onInput={noop}
          onSubmit={noop}
        />
      </Cell>
      <Cell>
        <CellHeader>Checking</CellHeader>
        <ApiKeyFormView
          class="w-full"
          value="sk-or-example"
          keyKind="openrouter"
          status="checking"
          onInput={noop}
          onSubmit={noop}
        />
      </Cell>
      <Cell>
        <CellHeader>Rejected by OpenRouter</CellHeader>
        <ApiKeyFormView
          class="w-full"
          value="sk-or-example"
          keyKind="openrouter"
          status="invalid"
          onInput={noop}
          onSubmit={noop}
        />
      </Cell>
      <Cell>
        <CellHeader>OpenAI key</CellHeader>
        <ApiKeyFormView
          class="w-full"
          value="sk-example"
          keyKind="openai"
          onInput={noop}
          onSubmit={noop}
        />
      </Cell>
      <Cell>
        <CellHeader>Wrong format</CellHeader>
        <ApiKeyFormView class="w-full" value="not-a-key" onInput={noop} onSubmit={noop} />
      </Cell>
      <Cell>
        <CellHeader>An old OpenAI key was removed</CellHeader>
        <ApiKeyFormView
          class="w-full"
          value=""
          openaiKeyRemoved
          onInput={noop}
          onSubmit={noop}
        />
      </Cell>
    </Cells>
  );
}

export function Options() {
  return (
    <Cells class="max-w-lg">
      <Cell>
        <CellHeader>Hidden label, custom hint and submit label</CellHeader>
        <ApiKeyFormView
          class="w-full"
          value=""
          hideLabel
          submitLabel="Save and start"
          hint="Your key stays in this browser."
          onInput={noop}
          onSubmit={noop}
        />
      </Cell>
    </Cells>
  );
}

export function Interactive() {
  const [value, setValue] = createSignal('');
  const [status, setStatus] = createSignal<ApiKeyFormStatus>('idle');
  let rejection: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(rejection));

  return (
    <Cells class="max-w-lg">
      <Cell>
        <CellHeader>
          Nothing is sent or saved here. Every key is rejected after a second.
        </CellHeader>
        <ApiKeyFormView
          class="w-full"
          value={value()}
          keyKind={detectKeyKind(value())}
          status={status()}
          onInput={(next) => {
            setValue(next);
            setStatus('idle');
          }}
          onSubmit={() => {
            setStatus('checking');
            clearTimeout(rejection);
            rejection = setTimeout(() => setStatus('invalid'), 1000);
          }}
        />
      </Cell>
    </Cells>
  );
}

export function Dialog() {
  const [submitLabel, setSubmitLabel] = createSignal<string>();

  return (
    <Cells>
      <Cell>
        <CellHeader>Save key</CellHeader>
        <Button variant="outline" onClick={() => setSubmitLabel('Save key')}>
          Open dialog
        </Button>
      </Cell>
      <Cell>
        <CellHeader>Save and send, when a message is waiting for a key</CellHeader>
        <Button variant="outline" onClick={() => setSubmitLabel('Save and send')}>
          Open dialog
        </Button>
      </Cell>
      <ApiKeyDialogView
        open={submitLabel() !== undefined}
        onOpenChange={(open) => !open && setSubmitLabel(undefined)}
      >
        <Show when={submitLabel()}>
          {(label) => (
            <ApiKeyFormView value="" submitLabel={label()} onInput={noop} onSubmit={noop} />
          )}
        </Show>
      </ApiKeyDialogView>
    </Cells>
  );
}

export function KeyNotice() {
  const [clicks, setClicks] = createSignal(0);

  return (
    <Cells>
      <Cell>
        <CellHeader>Shown in the composer without a key. Add key clicks: {clicks()}</CellHeader>
        <KeyNoticeView onAddKey={() => setClicks((count) => count + 1)} />
      </Cell>
    </Cells>
  );
}
