import { TextField } from '@kobalte/core/text-field';
import {
  createSignal,
  For,
  type JSX,
  onCleanup,
  onMount,
  type ParentComponent,
} from 'solid-js';

import { ChatInput } from '~/components/chat/chat-input';
import { ApiKeyFormView } from '~/components/connected/api-key-form-view';
import { ChatSettings } from '~/components/connected/chat-settings';
import { MultiCombobox } from '~/components/connected/multi-combobox';
import { IconChevronsUpDown } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import { Command, CommandEmpty, CommandInput, CommandList } from '~/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown';
import { SettingTitle } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '~/components/ui/switch';
import TextEditor from '~/components/ui/text-editor/text-editor';
import { TextArea } from '~/components/ui/textarea';
import { cn, noop } from '~/util';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS, sampleImageFile } from './story-fixtures';

const themes = ['Light', 'Dark', 'System'];

function ThemeSelect(props: {
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  invalid?: boolean;
  class?: string;
}) {
  return (
    <Select
      options={themes}
      itemComponent={(item) => <SelectItem item={item.item}>{item.item.rawValue}</SelectItem>}
      class={props.class ?? 'w-full'}
      placeholder={props.placeholder}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      validationState={props.invalid ? 'invalid' : undefined}
    >
      <SelectTrigger data-measure>
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}

// Lists models only, so the selection is always a model id.
function ModelCombobox(props: {
  modelId?: string;
  class?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  // oxlint-disable-next-line solid/reactivity -- Only the first value is used.
  const [modelId, setModelId] = createSignal(props.modelId);

  return (
    <MultiCombobox
      class={props.class}
      value={{ type: 'model', id: modelId() }}
      onSelect={({ referenceId }) => setModelId(referenceId)}
      includeModels
      disabled={props.disabled}
      invalid={props.invalid}
    />
  );
}

function MenuTrigger(props: {
  label: string;
  class?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        as={Button}
        variant="combobox"
        class={props.class}
        disabled={props.disabled}
        aria-invalid={props.invalid ? 'true' : undefined}
        data-measure
      >
        {props.label}
        <IconChevronsUpDown class="opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>Rename</DropdownMenuItem>
        <DropdownMenuItem>Duplicate</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// A row the height of one control, with hairlines at its top and bottom edge. A control that is
// taller or shorter than the others crosses or falls short of the lines.
const GuideRow: ParentComponent = (props) => (
  <div class="relative flex h-input-md items-center gap-2">
    {props.children}
    <div class="pointer-events-none absolute -inset-x-4 top-0 h-px bg-danger/40" />
    <div class="pointer-events-none absolute -inset-x-4 bottom-0 h-px bg-danger/40" />
  </div>
);

/** Every single-line control in one row, so heights, radii and borders can be compared. */
export function SideBySide() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Input, Select, Combobox, Dropdown trigger, Buttons</CellHeader>
        <GuideRow>
          <Input class="w-40" placeholder="Input" />
          <ThemeSelect class="w-40" placeholder="Select" />
          <ModelCombobox class="w-48" modelId={MODEL_IDS.anthropic} />
          <MenuTrigger label="Menu" class="w-32" />
          <Button variant="outline">Outline</Button>
          <Button>Primary</Button>
        </GuideRow>
      </Cell>
      <Cell>
        <CellHeader>Filled values</CellHeader>
        <GuideRow>
          <Input class="w-40" value="Trip to Lisbon" />
          <ThemeSelect class="w-40" defaultValue="Dark" />
          <ModelCombobox class="w-48" modelId={MODEL_IDS.openai} />
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
        </GuideRow>
      </Cell>
    </Cells>
  );
}

/** Controls that sit together in real forms: a field with its action, or two fields in a row. */
export function Pairs() {
  return (
    <Cells class="max-w-xl">
      <Cell>
        <CellHeader>Input with a primary button</CellHeader>
        <GuideRow>
          <Input placeholder="sk-or-..." />
          <Button>Save</Button>
        </GuideRow>
      </Cell>
      <Cell>
        <CellHeader>Input with an outline button</CellHeader>
        <GuideRow>
          <Input placeholder="Search models" />
          <Button variant="outline">Clear</Button>
        </GuideRow>
      </Cell>
      <Cell>
        <CellHeader>Input and Select</CellHeader>
        <GuideRow>
          <Input placeholder="Name" />
          <ThemeSelect class="w-48 shrink-0" defaultValue="System" />
        </GuideRow>
      </Cell>
      <Cell>
        <CellHeader>Select with a button</CellHeader>
        <GuideRow>
          <ThemeSelect class="min-w-0 flex-1" defaultValue="Light" />
          <Button variant="outline">Apply</Button>
        </GuideRow>
      </Cell>
      <Cell>
        <CellHeader>Combobox and Input</CellHeader>
        <GuideRow>
          <ModelCombobox class="w-56" modelId={MODEL_IDS.google} />
          <Input placeholder="Temperature" />
        </GuideRow>
      </Cell>
      <Cell>
        <CellHeader>Combobox and Select</CellHeader>
        <GuideRow>
          <ModelCombobox class="w-56" modelId={MODEL_IDS.anthropic} />
          <ThemeSelect class="min-w-0 flex-1" defaultValue="Dark" />
        </GuideRow>
      </Cell>
    </Cells>
  );
}

const LabelledField: ParentComponent<{ label: string }> = (props) => (
  <div class="flex flex-col gap-1">
    <SettingTitle>{props.label}</SettingTitle>
    {props.children}
  </div>
);

/** Labelled fields stacked at one width, as they appear on the settings pages. */
export function Stacked() {
  return (
    <div class="flex max-w-sm flex-col gap-4">
      <LabelledField label="Input">
        <Input placeholder="Assistant name" />
      </LabelledField>
      <LabelledField label="Select">
        <ThemeSelect defaultValue="System" />
      </LabelledField>
      <LabelledField label="Combobox">
        <ModelCombobox modelId={MODEL_IDS.anthropic} />
      </LabelledField>
      <LabelledField label="Dropdown trigger">
        <MenuTrigger label="Actions" class="w-full justify-between" />
      </LabelledField>
      <TextField class="flex flex-col gap-1">
        <SettingTitle>TextArea</SettingTitle>
        <TextArea placeholder="You are a helpful assistant." />
      </TextField>
      <Switch class="flex items-center justify-between" defaultChecked>
        <SwitchLabel class="text-sm font-medium">Switch</SwitchLabel>
        <SwitchControl>
          <SwitchThumb />
        </SwitchControl>
      </Switch>
    </div>
  );
}

type StateRow = {
  name: string;
  placeholder: () => JSX.Element;
  filled: () => JSX.Element;
  disabled: () => JSX.Element;
  invalid: () => JSX.Element;
};

function WideOutlineButton(props: { label: string; disabled?: boolean; invalid?: boolean }) {
  return (
    <Button
      variant="outline"
      class="w-full"
      disabled={props.disabled}
      aria-invalid={props.invalid ? 'true' : undefined}
    >
      {props.label}
    </Button>
  );
}

const stateRows: StateRow[] = [
  {
    name: 'Input',
    placeholder: () => <Input placeholder="Placeholder" />,
    filled: () => <Input value="Filled" />,
    disabled: () => <Input value="Disabled" disabled />,
    invalid: () => <Input value="Invalid" aria-invalid />,
  },
  {
    name: 'Select',
    placeholder: () => <ThemeSelect placeholder="Placeholder" />,
    filled: () => <ThemeSelect defaultValue="Dark" />,
    disabled: () => <ThemeSelect defaultValue="Dark" disabled />,
    invalid: () => <ThemeSelect defaultValue="Dark" invalid />,
  },
  {
    name: 'Combobox',
    placeholder: () => <ModelCombobox class="w-full" />,
    filled: () => <ModelCombobox class="w-full" modelId={MODEL_IDS.anthropic} />,
    disabled: () => <ModelCombobox class="w-full" modelId={MODEL_IDS.anthropic} disabled />,
    invalid: () => <ModelCombobox class="w-full" modelId={MODEL_IDS.anthropic} invalid />,
  },
  {
    name: 'Dropdown trigger',
    placeholder: () => <MenuTrigger label="Choose an action" />,
    filled: () => <MenuTrigger label="Duplicate" />,
    disabled: () => <MenuTrigger label="Duplicate" disabled />,
    invalid: () => <MenuTrigger label="Duplicate" invalid />,
  },
  {
    name: 'Outline button',
    placeholder: () => <WideOutlineButton label="Button" />,
    filled: () => <WideOutlineButton label="Button" />,
    disabled: () => <WideOutlineButton label="Disabled" disabled />,
    invalid: () => <WideOutlineButton label="Invalid" invalid />,
  },
];

const stateColumns = ['placeholder', 'filled', 'disabled', 'invalid'] as const;

/** Each control in each state, so the disabled and invalid styles can be compared across rows. */
export function States() {
  return (
    <div class="grid grid-cols-[8rem_repeat(4,minmax(0,1fr))] items-center gap-x-3 gap-y-4">
      <div />
      <For each={stateColumns}>
        {(column) => <div class="text-xs text-muted capitalize">{column}</div>}
      </For>
      <For each={stateRows}>
        {(row) => (
          <>
            <div class="text-sm font-medium">{row.name}</div>
            <For each={stateColumns}>{(column) => <div>{row[column]()}</div>}</For>
          </>
        )}
      </For>
    </div>
  );
}

const metrics = [
  ['Height', 'height'],
  ['Radius', 'border-top-left-radius'],
  ['Border', 'border-top-width'],
  ['Border colour', 'border-top-color'],
  ['Background', 'background-color'],
  ['Shadow', 'box-shadow'],
  ['Padding x', 'padding-left'],
  ['Font size', 'font-size'],
] as const;

type Measured = { name: string; values: string[] };

// Tailwind stacks ring and shadow layers, most of them transparent. Drop those so the shadow
// column shows only what is drawn.
const visibleShadow = (value: string) => {
  const layers = value.split(/,(?![^(]*\))/).map((layer) => layer.trim());
  const drawn = layers.filter((layer) => !layer.startsWith('rgba(0, 0, 0, 0)'));
  return drawn.length > 0 ? drawn.join(', ') : 'none';
};

type MeasuredControl = {
  name: string;
  render: () => JSX.Element;
  // The element that draws the control's chrome, when it is not marked with data-measure.
  target?: string;
  width?: string;
};

const measuredControls: MeasuredControl[] = [
  { name: 'Input', render: () => <Input data-measure placeholder="Input" /> },
  { name: 'Select', render: () => <ThemeSelect defaultValue="Dark" /> },
  {
    name: 'Combobox',
    // MultiCombobox does not pass extra props through, so measure its trigger button.
    target: 'button',
    render: () => <ModelCombobox modelId={MODEL_IDS.anthropic} />,
  },
  { name: 'Dropdown trigger', render: () => <MenuTrigger label="Menu" /> },
  {
    name: 'Outline button',
    render: () => (
      <Button variant="outline" data-measure>
        Outline
      </Button>
    ),
  },
  {
    name: 'TextArea',
    render: () => (
      <TextField>
        <TextArea data-measure rows="1" placeholder="TextArea" />
      </TextField>
    ),
  },
  {
    name: 'Command search',
    target: '[cmdk-input]',
    render: () => (
      <Command class="rounded-card border">
        <CommandInput placeholder="Search" />
      </Command>
    ),
  },
  {
    name: 'Composer',
    target: 'form',
    width: 'w-[534px]',
    render: () => (
      <ChatInput autofocus={false} input="" isLoading={false} onInput={noop} onSubmit={noop} />
    ),
  },
];

/**
 * The computed styles of each control, read from the DOM. Values that differ from the Input,
 * the baseline, are highlighted. They are read again when the theme changes.
 */
export function Measurements() {
  const [rows, setRows] = createSignal<Measured[]>([]);
  const cells: HTMLDivElement[] = [];

  const measure = () => {
    setRows(
      measuredControls.map((control, index) => {
        const cell = cells[index];
        const target = cell?.querySelector(control.target ?? '[data-measure]');
        const style = target ? getComputedStyle(target) : undefined;
        return {
          name: control.name,
          values: metrics.map(([, property]) => {
            const value = style?.getPropertyValue(property) ?? '—';
            return property === 'box-shadow' ? visibleShadow(value) : value;
          }),
        };
      }),
    );
  };

  // Wait a frame so fonts and theme classes have applied, then let colour transitions finish, or
  // the table would read values part-way through a theme change.
  const measureWhenSettled = () =>
    requestAnimationFrame(async () => {
      const transitions = document
        .getAnimations()
        .filter((animation) => animation instanceof CSSTransition);
      await Promise.allSettled(transitions.map((transition) => transition.finished));
      measure();
    });

  onMount(() => {
    measureWhenSettled();
    const observer = new MutationObserver(measureWhenSettled);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    onCleanup(() => observer.disconnect());
  });

  const baseline = () => rows()[0]?.values ?? [];

  return (
    <div class="flex flex-col gap-6">
      <div class="flex flex-wrap items-end gap-3">
        <For each={measuredControls}>
          {(control, index) => (
            <div
              class={cn('flex flex-col gap-1', control.width ?? 'w-44')}
              ref={(el) => (cells[index()] = el)}
            >
              <CellHeader>{control.name}</CellHeader>
              {control.render()}
            </div>
          )}
        </For>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead class="text-muted">
            <tr>
              <th class="py-1 pr-4 font-medium">Control</th>
              <For each={metrics}>
                {([label]) => <th class="py-1 pr-4 font-medium">{label}</th>}
              </For>
            </tr>
          </thead>
          <tbody class="font-mono">
            <For each={rows()}>
              {(row) => (
                <tr class="border-t">
                  <td class="py-1.5 pr-4 font-sans font-medium">{row.name}</td>
                  <For each={row.values}>
                    {(value, index) => (
                      <td
                        class="py-1.5 pr-4 break-all"
                        classList={{ 'text-danger': value !== baseline()[index()] }}
                      >
                        {value}
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
      <Button variant="outline" size="sm" class="self-start" onClick={measure}>
        Measure again
      </Button>
    </div>
  );
}

/**
 * The composer next to an Input and a TextArea of the same width, so its border, background,
 * shadow and focus ring can be compared with the plain fields. Click into each to compare focus.
 */
export function Composer() {
  const [input, setInput] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);
  const [attachments, setAttachments] = createSignal([sampleImageFile('One')]);

  return (
    <div class="flex w-[534px] flex-col gap-6">
      <Cell>
        <CellHeader>Input</CellHeader>
        <Input placeholder="Ask anything..." />
      </Cell>
      <TextField class="flex flex-col gap-2">
        <CellHeader>TextArea</CellHeader>
        <TextArea rows="1" placeholder="Ask anything..." />
      </TextField>
      <Cell>
        <CellHeader>Composer, interactive</CellHeader>
        <ChatInput
          autofocus={false}
          input={input()}
          isLoading={isLoading()}
          onInput={setInput}
          onSubmit={() => {
            setInput('');
            setIsLoading(true);
          }}
          onCancel={() => setIsLoading(false)}
        />
      </Cell>
      <Cell>
        <CellHeader>Composer with text</CellHeader>
        <ChatInput
          autofocus={false}
          input={
            'A longer question that wraps onto a second line, so the corners can be checked once the composer grows.'
          }
          isLoading={false}
          onInput={noop}
          onSubmit={noop}
        />
      </Cell>
      <Cell>
        <CellHeader>Composer, streaming</CellHeader>
        <ChatInput
          autofocus={false}
          input=""
          isLoading
          onInput={noop}
          onSubmit={noop}
          onCancel={noop}
        />
      </Cell>
      <Cell>
        <CellHeader>Composer with attachments</CellHeader>
        <div class="w-full pt-20">
          <ChatInput
            autofocus={false}
            input=""
            hasVision
            isLoading={false}
            attachments={attachments()}
            onRemoveFile={(file) => setAttachments((files) => files.filter((f) => f !== file))}
            onFileSelect={(file) => setAttachments((files) => [...files, file])}
            onInput={noop}
            onSubmit={noop}
          />
        </div>
      </Cell>
      <Cell>
        <CellHeader>Note editor, as on the note page</CellHeader>
        <div class="h-32 w-full rounded-md bg-surface-sunken p-3">
          <TextEditor
            autofocus={false}
            mode="note"
            placeholder="Write and refine a single prompt"
          />
        </div>
      </Cell>
    </div>
  );
}

/**
 * Components that combine several controls behind onInput, onChange or onSelect props, as they
 * appear in the app.
 */
export function InContext() {
  const [apiKey, setApiKey] = createSignal('');
  const [name, setName] = createSignal('Code Reviewer');
  const [subtitle, setSubtitle] = createSignal('');
  const [modelId, setModelId] = createSignal<string | undefined>(MODEL_IDS.anthropic);
  const [systemPrompt, setSystemPrompt] = createSignal('You review code and point out bugs.');

  return (
    <Cells class="max-w-2xl">
      <Cell>
        <CellHeader>ApiKeyFormView: Input and Button</CellHeader>
        <ApiKeyFormView class="w-full" value={apiKey()} onInput={setApiKey} onSubmit={noop} />
      </Cell>
      <Cell>
        <CellHeader>ApiKeyFormView, rejected</CellHeader>
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
        <CellHeader>ChatSettings: Input, Combobox and TextArea</CellHeader>
        <div class="w-full">
          <ChatSettings
            name={name()}
            subtitle={subtitle()}
            modelId={modelId()}
            systemPrompt={systemPrompt()}
            onNameChange={setName}
            onSubtitleChange={setSubtitle}
            onModelChange={setModelId}
            onSystemPromptChange={setSystemPrompt}
          />
        </div>
      </Cell>
      <Cell>
        <CellHeader>
          Command search field, as in the command menu and the model picker
        </CellHeader>
        {/* No items: cmdk scrolls its first item into view on mount, which would jump this
            page down. The search field is what this page compares. */}
        <Command class="w-full rounded-card border">
          <CommandInput placeholder="Search items..." />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
          </CommandList>
        </Command>
      </Cell>
    </Cells>
  );
}
