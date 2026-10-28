import type { ModelProps } from '~/types';

export function compareModels(
  a: ModelProps,
  b: ModelProps,
  column: string,
  direction: 'ASC' | 'DESC' | undefined,
) {
  if (column === '') return 0;

  let aValue, bValue;

  if (column === 'pricing-context') {
    aValue = a.pricing?.prompt;
    bValue = b.pricing?.prompt;
  } else if (column === 'pricing-output') {
    aValue = a.pricing?.completion;
    bValue = b.pricing?.completion;
  } else if (column === 'creator') {
    aValue = a.creator.name;
    bValue = b.creator.name;
  } else {
    aValue = a[column as keyof ModelProps];
    bValue = b[column as keyof ModelProps];
  }

  if (aValue === undefined) return bValue === undefined ? 0 : 1;
  if (bValue === undefined) return -1;

  if (aValue < bValue) return direction === 'ASC' ? -1 : 1;
  if (aValue > bValue) return direction === 'ASC' ? 1 : -1;
  return 0;
}
