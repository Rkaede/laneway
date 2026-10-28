import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ParentComponent } from 'solid-js';
import { splitProps } from 'solid-js';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

import { icons } from './badge';
import { roleColorVariants } from './role-colors';

const iconBadgeVariants = cva('inline-flex items-center transition-colors', {
  variants: {
    variant: roleColorVariants('text'),
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
