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

const tagVariants = cva('inline-flex items-center gap-1 rounded-full text-xs font-medium', {
  variants: {
    variant: {
      assistant:
        'bg-orange-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-950 dark:text-fuchsia-300 dark:border-fuchsia-800',
      free: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
      model:
        'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800',
      new: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      online:
        'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
      preset:
        'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
      reasoning:
        'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
      vision:
        'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    },
    subtle: {
      true: 'bg-transparent dark:bg-transparent p-0',
      false: 'border px-2 py-0.5',
    },
  },
  defaultVariants: {
    variant: 'free',
    subtle: false,
  },
});

type BadgeVariant =
  | 'free'
  | 'reasoning'
  | 'new'
  | 'vision'
  | 'online'
  | 'preset'
  | 'model'
  | 'assistant';

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
