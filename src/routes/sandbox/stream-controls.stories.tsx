import { createSignal, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';

import { ChatPanel } from '~/components/chat/chat-panel';
import { JumpToLatest } from '~/components/chat/components';
import { Button } from '~/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import {
  getStreamDisplayMode,
  STREAM_DISPLAY_MODES,
  type StreamDisplayMode,
} from '~/constants';
import { setStore, store } from '~/store';
import type { ChatProps } from '~/types';

import { Cell, CellHeader, Cells } from './story-components';
import { MODEL_IDS } from './story-fixtures';

export function JumpToLatestButton() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Default</CellHeader>
        <JumpToLatest onClick={() => {}} />
      </Cell>
    </Cells>
  );
}

const PARAGRAPHS = [
  'Compound interest is interest earned on both the money you put in and the interest that has already been added.',
  'Suppose you save 1,000 at 5% a year. After the first year you have 1,050. In the second year the 5% applies to 1,050, not 1,000, so you earn 52.50.',
  'The formula looks like this:\n\n```ts\nconst balance = (principal: number, rate: number, years: number) =>\n  principal * (1 + rate) ** years;\n```',
  'The gap between simple and compound growth is small at first and large later, which is why starting early matters more than saving a lot.',
  '- Simple interest: 1,000 grows by 50 every year.\n- Compound interest: 1,000 grows by 50, then 52.50, then 55.13, and so on.',
  'Time does most of the work. At 5% a year, money doubles in roughly fourteen years, and doubles again in the next fourteen.',
  'Fees count too. A 1% annual fee on a 5% return takes away a fifth of your growth, and that loss compounds as well.',
];

const LENGTHS = [
  { id: 'short', label: 'Short', paragraphs: 3 },
  { id: 'medium', label: 'Medium', paragraphs: 7 },
  { id: 'long', label: 'Long', paragraphs: 21 },
] as const;

const SPEEDS = [
  { id: 'slow', label: 'Slow', msPerWord: 160 },
  { id: 'normal', label: 'Normal', msPerWord: 50 },
  { id: 'fast', label: 'Fast', msPerWord: 12 },
] as const;

type Option = { id: string; label: string };

function Choice<T extends Option>(props: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div class="flex flex-col gap-1">
      <span class="text-xs text-muted">{props.label}</span>
      <Select
        options={[...props.options]}
        optionValue="id"
        optionTextValue="label"
        value={props.value}
        onChange={(value) => value && props.onChange(value)}
        itemComponent={(item) => (
          <SelectItem item={item.item}>{item.item.rawValue.label}</SelectItem>
        )}
      >
        <SelectTrigger class="w-40">
          <SelectValue<T>>{(state) => state.selectedOption().label}</SelectValue>
        </SelectTrigger>
        <SelectContent />
      </Select>
    </div>
  );
}

/**
 * A chat lane that streams a made-up answer, so the streaming display modes and the follow
 * behaviour can be tried without a model. Scroll up while it streams to see "Jump to latest".
 */
export function Playground() {
  const [chat, setChat] = createStore<ChatProps>({
    id: 'playground',
    messages: [],
    status: 'idle',
    modelId: MODEL_IDS.openai,
  });
  const [length, setLength] = createSignal<(typeof LENGTHS)[number]>(LENGTHS[1]);
  const [speed, setSpeed] = createSignal<(typeof SPEEDS)[number]>(SPEEDS[1]);
  let timer: ReturnType<typeof setInterval> | undefined;
  let runs = 0;

  // The display mode is a real app setting, so put it back when the story is closed.
  const original = store.settings.streaming.display;
  onCleanup(() => {
    stop();
    setStore('settings', 'streaming', 'display', original);
  });

  function stop() {
    clearInterval(timer);
    timer = undefined;
  }

  function finish(cancelled: boolean) {
    stop();
    const content = chat.latest?.content;
    setChat({
      latest: undefined,
      status: cancelled ? 'canceled' : 'idle',
      messages: content
        ? [
            ...chat.messages,
            {
              id: `answer-${runs}`,
              role: 'assistant',
              content: String(content),
              cancelled: cancelled || undefined,
            },
          ]
        : chat.messages,
    });
  }

  function start() {
    stop();
    runs += 1;
    const text = Array.from(
      { length: length().paragraphs },
      (_, i) => PARAGRAPHS[i % PARAGRAPHS.length],
    ).join('\n\n');
    // Split on spaces and keep the whitespace, so joining the pieces gives the text back.
    const pieces = text.split(/(?<= )/);
    let sent = 0;
    setChat({
      messages: [
        ...chat.messages,
        { id: `question-${runs}`, role: 'user', content: 'What is compound interest?' },
      ],
      status: 'loading',
      latest: undefined,
    });
    timer = setInterval(() => {
      sent += 1;
      setChat('latest', {
        id: `answer-${runs}`,
        role: 'assistant',
        content: pieces.slice(0, sent).join(''),
      });
      if (sent >= pieces.length) finish(false);
    }, speed().msPerWord);
  }

  function reset() {
    stop();
    setChat({ messages: [], latest: undefined, status: 'idle' });
  }

  return (
    <div class="flex max-w-[70ch] flex-col gap-4">
      <div class="flex flex-wrap items-end gap-3">
        <Choice
          label="Streaming display"
          options={STREAM_DISPLAY_MODES}
          value={getStreamDisplayMode(store.settings.streaming.display)}
          onChange={(mode) =>
            setStore('settings', 'streaming', 'display', mode.id as StreamDisplayMode)
          }
        />
        <Choice label="Answer length" options={LENGTHS} value={length()} onChange={setLength} />
        <Choice label="Speed" options={SPEEDS} value={speed()} onChange={setSpeed} />
      </div>
      <div class="flex gap-2">
        <Button onClick={start} disabled={chat.status === 'loading'}>
          Send
        </Button>
        <Button
          variant="outline"
          onClick={() => finish(true)}
          disabled={chat.status !== 'loading'}
        >
          Stop
        </Button>
        <Button variant="ghost" onClick={reset}>
          Reset
        </Button>
      </div>
      {/* The same scroller and lane grid as the chat view: newest output at the bottom. */}
      <div class="flex h-[30rem] flex-col-reverse overflow-auto rounded-lg border border-border">
        <div class="group/panels relative grid flex-1 grid-cols-[minmax(0,70ch)] justify-center">
          <ChatPanel isExample isFirst isLast chat={chat} />
        </div>
      </div>
    </div>
  );
}
