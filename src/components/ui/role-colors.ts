const roleColors = {
  assistant: {
    border: 'border-important-border',
    background: 'bg-important-subtle',
    text: 'text-important-subtle-fg',
  },
  free: {
    border: 'border-success-border',
    background: 'bg-success-subtle',
    text: 'text-success-subtle-fg',
  },
  model: {
    border: 'border-neutral-border',
    background: 'bg-neutral-subtle',
    text: 'text-neutral-subtle-fg',
  },
  new: {
    border: 'border-warning-border',
    background: 'bg-warning-subtle',
    text: 'text-warning-subtle-fg',
  },
  online: {
    border: 'border-active-border',
    background: 'bg-active-subtle',
    text: 'text-active-subtle-fg',
  },
  preset: {
    border: 'border-brand-border',
    background: 'bg-brand-subtle',
    text: 'text-brand-subtle-fg',
  },
  reasoning: {
    border: 'border-info-border',
    background: 'bg-info-subtle',
    text: 'text-info-subtle-fg',
  },
  vision: {
    border: 'border-confirmed-border',
    background: 'bg-confirmed-subtle',
    text: 'text-confirmed-subtle-fg',
  },
};

export function roleColorVariants(...parts: Array<'border' | 'background' | 'text'>) {
  return Object.fromEntries(
    Object.entries(roleColors).map(([role, colors]) => [
      role,
      parts.map((part) => colors[part]).join(' '),
    ]),
  ) as Record<keyof typeof roleColors, string>;
}
