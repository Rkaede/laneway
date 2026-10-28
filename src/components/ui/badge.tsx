import { cva, type VariantProps } from 'class-variance-authority';
import BoxIcon from 'lucide-solid/icons/box';
import BrainIcon from 'lucide-solid/icons/brain';
import HeadphonesIcon from 'lucide-solid/icons/headphones';
import ImageIcon from 'lucide-solid/icons/image';
import LayoutTemplateIcon from 'lucide-solid/icons/layout-template';
import SparklesIcon from 'lucide-solid/icons/sparkles';
import TagIcon from 'lucide-solid/icons/tag';
import WifiIcon from 'lucide-solid/icons/wifi';
import type { ComponentProps, JSX, ParentComponent } from 'solid-js';
import { mergeProps, Show, splitProps } from 'solid-js';

const tagVariants = cva('inline-flex items-center gap-1 rounded-badge text-xs font-medium', {
  variants: {
    variant: {
      assistant: 'border-important-border bg-important-subtle text-important-subtle-fg',
      free: 'border-success-border bg-success-subtle text-success-subtle-fg',
      model: 'border-neutral-border bg-neutral-subtle text-neutral-subtle-fg',
      new: 'border-warning-border bg-warning-subtle text-warning-subtle-fg',
      online: 'border-active-border bg-active-subtle text-active-subtle-fg',
      preset: 'border-brand-border bg-brand-subtle text-brand-subtle-fg',
      reasoning: 'border-info-border bg-info-subtle text-info-subtle-fg',
      vision: 'border-confirmed-border bg-confirmed-subtle text-confirmed-subtle-fg',
    },
    subtle: {
      true: 'bg-transparent p-0',
      false: 'border px-2 py-0.5',
    },
  },
  defaultVariants: {
    variant: 'free',
    subtle: false,
  },
});

type BadgeVariant =
  'free' | 'reasoning' | 'new' | 'vision' | 'online' | 'preset' | 'model' | 'assistant';

export type BadgeProps = ComponentProps<'span'> &
  VariantProps<typeof tagVariants> & {
    children?: JSX.Element;
    showIcon?: boolean;
  };

export const icons: Record<BadgeVariant, (props: { class?: string }) => JSX.Element> = {
  free: TagIcon,
  reasoning: BrainIcon,
  new: SparklesIcon,
  vision: ImageIcon,
  online: WifiIcon,
  preset: LayoutTemplateIcon,
  model: BoxIcon,
  assistant: HeadphonesIcon,
};

export const Badge: ParentComponent<BadgeProps> = (props) => {
  const merged = mergeProps({ showIcon: true, subtle: false }, props);
  const [local, rest] = splitProps(merged, [
    'class',
    'variant',
    'children',
    'showIcon',
    'subtle',
  ]);

  return (
    <span
      class={tagVariants({ variant: local.variant, subtle: local.subtle, class: local.class })}
      {...rest}
    >
      <Show when={local.showIcon && local.variant}>
        {local.variant &&
          (() => {
            const Icon = icons[local.variant as BadgeVariant];
            return <Icon class="size-3" />;
          })()}
      </Show>
      {local.children}
    </span>
  );
};
