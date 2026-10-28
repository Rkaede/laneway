import { Show } from 'solid-js';

import { Button } from '~/components/ui/button';

export function CollectionEmptyState(props: {
  name: string;
  description: string;
  searchTerm: string;
  onClearSearch: () => void;
}) {
  return (
    <div role="status" class="col-span-full flex flex-col items-center gap-2 py-12 text-center">
      <Show
        when={props.searchTerm}
        fallback={
          <>
            <p class="font-medium">No {props.name} yet.</p>
            <p class="text-sm text-muted">{props.description}</p>
          </>
        }
      >
        <p class="font-medium">No {props.name} match your search.</p>
        <p class="text-sm text-muted">Try a different search term or clear your search.</p>
        <Button variant="outline" size="sm" onClick={props.onClearSearch}>
          Clear search
        </Button>
      </Show>
    </div>
  );
}
