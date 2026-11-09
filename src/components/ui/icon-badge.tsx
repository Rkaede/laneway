import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ParentComponent } from 'solid-js';
import { splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/util';

import { icons } from './badge';
import { roleColorVariants } from './role-colors';

const defaultVariant = 'free';

const iconBadgeVariants = cva('inline-flex items-center transition-colors', {
  variants: {
    variant: roleColorVariants('text'),
  },
  defaultVariants: {
    variant: defaultVariant,
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

  return (
    <Tooltip placement="top">
      <TooltipTrigger
        as="span"
        class={cn(iconBadgeVariants({ variant: local.variant }), local.class)}
        {...accessibilityProps}
        {...rest}
      >
        <Dynamic component={icons[local.variant ?? defaultVariant]} class="size-[14px]" />
      </TooltipTrigger>
      <TooltipContent>{local.variant}</TooltipContent>
    </Tooltip>
  );
};
