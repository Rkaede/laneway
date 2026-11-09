import { dequal } from 'dequal/lite';
import { createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';

import { clone } from '~/util';

type Fetcher = (path: string) => Promise<Response>;

export async function fetchTemplateGallery<T>(
  path: string,
  fetcher: Fetcher = fetch,
): Promise<T[]> {
  const response = await fetcher(path);
  if (!response.ok) throw new Error(`${path} responded with HTTP ${response.status}.`);
  return response.json();
}

/**
 * Loads a gallery for a page. A gallery that cannot be loaded is logged and treated as empty, so
 * the error never reaches the resource: reading an errored resource throws to the root boundary.
 */
export async function loadTemplateGallery<T>(path: string, fetcher?: Fetcher): Promise<T[]> {
  try {
    return await fetchTemplateGallery<T>(path, fetcher);
  } catch (error) {
    console.error(`Could not load ${path}:`, error);
    return [];
  }
}

/** An item with no title matches an empty search, so it stays listed and can be edited. */
export function matchesTemplateSearch(title: string | undefined, searchTerm: string) {
  return (title ?? '').toLowerCase().includes(searchTerm.toLowerCase());
}

export function createTemplateEditor<T extends object>(options: {
  initialValue: () => T;
  validate: (value: T) => string | undefined;
  onDirtyChange: (isDirty: boolean) => void;
  onSave: (value: T) => void;
}) {
  const [value, setValue] = createStore<T>(clone(options.initialValue()));
  const validationError = () => options.validate(value);
  const hasChanges = () => !dequal(options.initialValue(), value);

  createEffect(() => options.onDirtyChange(hasChanges()));

  function save() {
    if (validationError()) return;
    options.onSave(value);
  }

  return { value, setValue, validationError, hasChanges, save };
}
