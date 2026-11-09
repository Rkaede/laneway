import { CollectionEmptyState } from '~/components/ui/collection-empty-state';
import { noop } from '~/util';

export function NoItems() {
  return (
    <CollectionEmptyState
      name="assistants"
      description="Create an assistant, or add one from the library."
      searchTerm=""
      onClearSearch={noop}
    />
  );
}

export function NoSearchResults() {
  return (
    <CollectionEmptyState
      name="assistants"
      description="Create an assistant, or add one from the library."
      searchTerm="unicorn"
      onClearSearch={noop}
    />
  );
}
