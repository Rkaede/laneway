import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { ChatCard } from '~/components/chat/chat-card';
import { useActionContext } from '~/hooks/use-action-context';
import { store } from '~/store';
import { actions } from '~/store/actions';
import { models } from '~/store/models';
import { SpeedDialItem } from '~/types';

interface SpeedDialProps {
  items: SpeedDialItem[];
}

export const SpeedDial: Component<SpeedDialProps> = (props) => {
  const context = useActionContext();

  return (
    <div
      class="grid w-[660px] grid-cols-3 flex-wrap justify-center gap-4"
      style={{ 'grid-template-columns': 'repeat(auto-fit, minmax(200px, 200px))' }}
    >
      <For each={props.items.filter((item) => item.referenceId !== '')}>
        {(item) => {
          const record = () => {
            if (item.type === 'model') {
              const model = models.find((m) => m.id === item.referenceId);
              return { title: model?.title, subtitle: item.title ?? model?.creator.name };
            }
            if (item.type === 'assistant') {
              const assistant = store.assistants.find((a) => a.id === item.referenceId);
              return { title: assistant?.title, subtitle: item.title ?? assistant?.subtitle };
            }
            if (item.type === 'preset') {
              const preset = store.presets.find((p) => p.id === item.referenceId);
              return {
                title: preset?.presetTitle,
                subtitle: item.title ?? preset?.presetDescription,
              };
            }

            return { title: '', subtitle: '' };
          };
          return (
            <ChatCard
              title={record().title}
              subtitle={record().subtitle}
              tags={[item.type]}
              onClick={() => {
                switch (item.type) {
                  case 'model':
                  case 'assistant':
                  case 'preset':
                    actions.newSession.fn(context, {
                      template: { type: item.type, id: item.referenceId },
                    });
                    break;
                  case 'voice':
                    // Implement voice session initiation
                    break;
                  case 'notebook':
                    // Implement notebook session initiation
                    break;
                  default:
                    console.warn(`Unknown speed dial type: ${item.type}`);
                }
              }}
            />
          );
        }}
      </For>
    </div>
  );
};
