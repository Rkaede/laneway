import { createSignal } from 'solid-js';

import { type SpeedDialCard, SpeedDialView } from '~/components/connected/speed-dial-view';
import { noop } from '~/util';

import { CellHeader } from './story-components';
import { MODEL_IDS } from './story-fixtures';

const cards: SpeedDialCard[] = [
  {
    id: 'model',
    title: 'GPT-6.1 Terra',
    subtitle: 'OpenAI',
    tags: ['model', 'new'],
    models: [MODEL_IDS.openai],
  },
  {
    id: 'free',
    title: 'GLaDOS',
    subtitle: 'Aperture',
    tags: ['model', 'free'],
    models: [MODEL_IDS.free],
  },
  {
    id: 'online',
    title: 'Sonar Pro Search',
    subtitle: 'Online search',
    tags: ['model', 'online'],
    models: [MODEL_IDS.search],
  },
  {
    id: 'note',
    title: 'Claude Sonnet 5.5',
    subtitle: 'Anthropic',
    tags: ['model', 'note'],
    models: [MODEL_IDS.anthropic],
  },
  {
    id: 'assistant',
    title: 'Code Reviewer',
    subtitle: 'Finds bugs before they ship',
    tags: ['assistant'],
    models: [MODEL_IDS.anthropic],
  },
  {
    id: 'preset',
    title: 'Flagship',
    subtitle: 'Compare frontier models.',
    tags: ['preset'],
    models: [MODEL_IDS.openai, MODEL_IDS.anthropic, MODEL_IDS.google],
  },
];

export function ItemTypes() {
  const [selected, setSelected] = createSignal('nothing yet');

  return (
    <>
      <CellHeader>Picked: {selected()}</CellHeader>
      <SpeedDialView cards={cards} onSelect={setSelected} />
    </>
  );
}

export function SingleCard() {
  return <SpeedDialView cards={cards.slice(0, 1)} onSelect={noop} />;
}

export function NoCards() {
  return <SpeedDialView cards={[]} onSelect={noop} />;
}
