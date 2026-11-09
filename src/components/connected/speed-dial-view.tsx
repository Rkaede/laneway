import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { Shortcut } from '~/components/ui/shortcut';

import { SpeedDialOption } from './speed-dial-option';

export type SpeedDialCard = {
  id: string;
  title?: string;
  subtitle?: string;
  tags?: string[];
  models?: string[];
};

export const SpeedDialView: Component<{
  cards: SpeedDialCard[];
  onSelect: (id: string) => void;
}> = (props) => {
  return (
    <div class="flex flex-col gap-2 self-center">
      <div
        class="grid max-w-[720px] grid-cols-3 flex-wrap justify-center gap-4"
        style={{
          'grid-template-columns': 'repeat(auto-fit, minmax(210px, 210px))',
          'grid-auto-rows': '1fr',
        }}
      >
        <For each={props.cards}>
          {(card) => (
            <SpeedDialOption
              title={card.title}
              subtitle={card.subtitle}
              showSubtitle
              tags={card.tags}
              models={card.models}
              onClick={() => props.onSelect(card.id)}
            />
          )}
        </For>
      </div>
      <div class="self-center text-xs text-muted">
        <Shortcut variant="solid">$mod+K</Shortcut> for more options.
      </div>
    </div>
  );
};
