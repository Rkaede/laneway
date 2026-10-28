import { dequal } from 'dequal/lite';
import { createEffect } from 'solid-js';
import { createStore } from 'solid-js/store';

import { clone } from '~/util';

export async function fetchTemplateGallery<T>(
  path: string,
  fetcher: (path: string) => Promise<Response> = fetch,
): Promise<T[]> {
  const response = await fetcher(path);
  return response.json();
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
