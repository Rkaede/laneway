import { store } from '~/store';
export function Debug() {
  return (
    <div class="h-full overflow-auto text-sm">
      <pre>{JSON.stringify(store, null, 2)}</pre>
    </div>
  );
}
