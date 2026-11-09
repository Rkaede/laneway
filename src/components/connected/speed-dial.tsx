import type { Component } from 'solid-js';
import { createMemo } from 'solid-js';

import { useActionContext } from '~/hooks/use-action-context';
import { store } from '~/store';
import { actions } from '~/store/actions';
import { models } from '~/store/models';
import type { SpeedDialItem } from '~/types';

import { type SpeedDialCard, SpeedDialView } from './speed-dial-view';

interface SpeedDialProps {
  items: SpeedDialItem[];
}

function modelTags(modelId: string | undefined) {
  const tags = models.find((m) => m.id === modelId)?.tags;
  return (['online', 'free', 'new'] as const).filter((tag) => tags?.includes(tag));
}

function toCard(item: SpeedDialItem): SpeedDialCard {
  const noteTag = item.sessionType === 'note' ? ['note'] : [];

  if (item.type === 'model') {
    const model = models.find((m) => m.id === item.referenceId);
    return {
      id: item.id,
      title: model?.title,
      subtitle: item.title ?? model?.creator.name,
      models: item.referenceId ? [item.referenceId] : [],
      tags: ['model', ...modelTags(item.referenceId), ...noteTag],
    };
  }

  if (item.type === 'assistant') {
    const assistant = store.assistants.find((a) => a.id === item.referenceId);
    return {
      id: item.id,
      title: assistant?.title,
      subtitle: item.title ?? assistant?.subtitle,
      models: assistant?.modelId ? [assistant.modelId] : [],
      tags: ['assistant', ...modelTags(assistant?.modelId), ...noteTag],
    };
  }

  if (item.type === 'preset') {
    const preset = store.presets.find((p) => p.id === item.referenceId);
    const online = preset?.chats.some((c) => modelTags(c.modelId).includes('online'));
    return {
      id: item.id,
      title: preset?.presetTitle,
      subtitle: item.title ?? preset?.presetDescription,
      models: preset?.chats
        .map((c) => c.modelId)
        .filter((id): id is string => id !== undefined),
      tags: online ? ['preset', 'online'] : ['preset'],
    };
  }

  return { id: item.id, title: '', subtitle: '' };
}

export const SpeedDial: Component<SpeedDialProps> = (props) => {
  const context = useActionContext();

  const visibleItems = () =>
    props.items.filter((item) => item.referenceId !== '' && item.sessionType && item.type);

  const cards = createMemo(() => visibleItems().map(toCard));

  function handleSelect(id: string) {
    const item = visibleItems().find((candidate) => candidate.id === id);
    if (!item) return;

    const action = item.sessionType === 'note' ? actions.newNote : actions.newSession;
    action.fn(context, { referenceId: item.referenceId, type: item.type });
  }

  return <SpeedDialView cards={cards()} onSelect={handleSelect} />;
};
