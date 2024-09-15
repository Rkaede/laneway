import { type Component, createMemo } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import * as creatorIcons from '~/components/icons/creators';
import * as modelIcons from '~/components/icons/models';
import { IconBot } from '~/components/icons/ui';
import { models } from '~/store/models';
import { cn } from '~/util';

type ModelIconProps = {
  modelId?: string;
  class?: string;
};

type ModelIcons = keyof typeof modelIcons;
type CreatorIcons = keyof typeof creatorIcons;

export const ModelIcon: Component<ModelIconProps> = (props) => {
  const icon = createMemo(() => {
    const model = models.find((m) => m.id === props.modelId);

    if (model?.icon) {
      const modelIcon = modelIcons[model.icon as ModelIcons];
      if (modelIcon) {
        return modelIcon;
      }
    }

    const creatorIcon = creatorIcons[model?.creator?.icon as CreatorIcons];
    return creatorIcon ?? IconBot;
  });

  return (
    <Dynamic
      component={icon()}
      {...props}
      // pointer-events-none is needed to prevent the browser popover for the title
      // attribute in the svg
      class={cn(props.class, 'pointer-events-none')}
    />
  );
};
