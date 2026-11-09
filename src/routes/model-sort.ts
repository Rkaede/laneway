import type { ModelProps } from '~/types';

// A number OpenRouter does not have can reach models.json as null: NaN serialises to null.
const isMissing = (value: unknown): value is null | undefined =>
  value === undefined || value === null || Number.isNaN(value);

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

  if (isMissing(aValue)) return isMissing(bValue) ? 0 : 1;
  if (isMissing(bValue)) return -1;

  let order = 0;
  if (typeof aValue === 'string' && typeof bValue === 'string') {
    order = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
  } else if (aValue < bValue) {
    order = -1;
  } else if (aValue > bValue) {
    order = 1;
  }

  if (order === 0) return 0;
  return direction === 'ASC' ? order : -order;
}
