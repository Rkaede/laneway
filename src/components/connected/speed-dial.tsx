import type { Component } from 'solid-js';
import { For } from 'solid-js';

import { Shortcut } from '~/components/ui';
import { useActionContext } from '~/hooks/use-action-context';
import { store } from '~/store';
import { actions } from '~/store/actions';
import { models } from '~/store/models';
import {
  selectAssistantById,
  selectPresetById,
  selectModelById,
} from '~/store/selectors';
import type { SpeedDialItem } from '~/types';

import { SpeedDialOption } from './speed-dial-option';

interface SpeedDialProps {
  items: SpeedDialItem[];
}

export const SpeedDial: Component<SpeedDialProps> = (props) => {
  const context = useActionContext();

  return (
    <div class="flex flex-col gap-2 self-center">
      <div
        class="grid max-w-[720px] grid-cols-3 flex-wrap justify-center gap-4"
        style={{
          'grid-template-columns': 'repeat(auto-fit, minmax(210px, 210px))',
          'grid-auto-rows': '1fr',
        }}
      >
        <For each={props.items.filter((item) => item.referenceId !== '')}>
          {(item) => {
            const record = () => {
              if (item.type === 'model') {
                const model = selectModelById(item.referenceId)();
                const tags = ['model'];

                if (model?.tags?.includes('online')) {
                  tags.push('online');
                }

                if (model?.tags?.includes('free')) {
                  tags.push('free');
                }

                if (model?.tags?.includes('new')) {
                  tags.push('new');
                }

                if (item.sessionType === 'note') {
                  tags.push('note');
                }

                return {
                  title: model?.title,
                  subtitle: item.title ?? model?.creator.name,
                  models: item.referenceId ? [item.referenceId] : [],
                  tags,
                };
              }
              if (item.type === 'assistant') {
                const assistant = selectAssistantById(item.referenceId)();
                const tags = ['assistant'];
                const model = selectModelById(assistant?.modelId)();
                if (model?.tags?.includes('online')) {
                  tags.push('online');
                }

                if (model?.tags?.includes('free')) {
                  tags.push('free');
                }

                if (model?.tags?.includes('new')) {
                  tags.push('new');
                }

                if (item.sessionType === 'note') {
                  tags.push('note');
                }

                return {
                  title: assistant?.title,
                  subtitle: item.title ?? assistant?.subtitle,
                  models: assistant?.modelId ? [assistant?.modelId] : [],
                  tags,
                };
              }

              if (item.type === 'preset') {
                const preset = selectPresetById(item.referenceId)();
                const tags = ['preset'];

                const online = preset?.chats.some((c) => {
                  const model = selectModelById(c.modelId)();
                  return model?.tags?.includes('online');
                });

                if (online) {
                  tags.push('online');
                }

                return {
                  title: preset?.presetTitle,
                  subtitle: item.title ?? preset?.presetDescription,
                  models: preset?.chats
                    .map((c) => c.modelId)
                    .filter((id): id is string => id !== undefined),
                  tags,
                };
              }

              return { title: '', subtitle: '' };
            };

            if (!item.sessionType || !item.type) return null;
            return (
              <SpeedDialOption
                title={record().title}
                subtitle={record().subtitle}
                tags={record().tags}
                sessionType={item.sessionType}
                models={record().models}
                online={record().tags?.includes('online')}
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
