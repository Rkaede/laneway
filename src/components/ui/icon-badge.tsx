import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ParentComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

import { icons } from './badge';

const iconBadgeVariants = cva('inline-flex items-center transition-colors', {
  variants: {
    variant: {
      assistant: 'text-fuchsia-600 dark:text-fuchsia-400',
      free: 'text-emerald-600 dark:text-emerald-400',
      model: 'text-slate-600 dark:text-slate-400',
      new: 'text-amber-600 dark:text-amber-400',
      online: 'text-green-600 dark:text-green-400',
      preset: 'text-indigo-600 dark:text-indigo-400',
      reasoning: 'text-sky-600  dark:text-sky-400',
      vision: 'text-purple-600 dark:text-purple-400',
    },
  },
  defaultVariants: {
    variant: 'free',
  },
});

export type IconBadgeProps = ComponentProps<'span'> &
  VariantProps<typeof iconBadgeVariants> & {
    label?: string;
  };

export const IconBadge: ParentComponent<IconBadgeProps> = (props) => {
  const [local, rest] = splitProps(props, ['class', 'variant', 'label']);

  const accessibilityProps = {
    'aria-label': local.label ?? local.variant ?? undefined,
  };

  const Icon = icons[local.variant!];

  return (
    <Tooltip placement="top">
      <TooltipTrigger
        as="span"
        class={iconBadgeVariants({ variant: local.variant, class: local.class })}
        {...accessibilityProps}
        {...rest}
      >
        <Icon class="size-[14px]" />
      </TooltipTrigger>
      <TooltipContent>{local.variant}</TooltipContent>
    </Tooltip>
  );
};
