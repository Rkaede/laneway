import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { Shortcut } from '~/components/ui';
import { useActionContext } from '~/hooks/use-action-context';
import { store } from '~/store';
import { actions } from '~/store/actions';
import { models } from '~/store/models';
import { SpeedDialItem } from '~/types';

import { ChatCard } from './dial-item';

interface SpeedDialProps {
  items: SpeedDialItem[];
}

export const SpeedDial: Component<SpeedDialProps> = (props) => {
  const context = useActionContext();

  return (
    <div class="flex flex-col gap-2 self-center">
      <div
        class="grid max-w-[660px] grid-cols-3 flex-wrap justify-center gap-4"
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

            if (!item.sessionType || !item.type) return null;
            return (
              <ChatCard
                title={record().title}
                subtitle={record().subtitle}
                tags={[item.type]}
                sessionType={item.sessionType}
                onClick={() => {
                  if (item.sessionType === 'note') {
                    actions.newNote.fn(context, {
                      referenceId: item.referenceId,
                      type: item.type,
                    });
                    return;
                  } else {
                    actions.newSession.fn(context, {
                      referenceId: item.referenceId,
                      type: item.type,
                    });
                  }
                }}
              />
            );
          }}
        </For>
      </div>
      <div class="self-center text-xs text-muted-foreground">
        <Shortcut variant="solid">$mod+K</Shortcut> for more options.
      </div>
    </div>
  );
};
