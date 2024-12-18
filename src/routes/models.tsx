import type { JSX, ParentComponent } from 'solid-js';
import { createMemo, createSignal, For } from 'solid-js';

import { ModelIcon } from '~/components/connected/model-icon';
import { IconChevronDown, IconChevronUp } from '~/components/icons/ui';
import { PageTitle, SectionDescription } from '~/components/ui';
import { Avatar, Tag } from '~/components/ui';
import { models } from '~/store/models';
import type { ModelProps } from '~/types';

type SortableHeaderProps = {
  column: string;
  children: JSX.Element;
  sortDirection?: 'ASC' | 'DESC' | undefined;
  handleSort: (column: string) => void;
  align?: 'left' | 'center' | 'right';
};

const SortableHeader: ParentComponent<SortableHeaderProps> = (props) => (
  <th
    class={`cursor-pointer border-b px-2 py-1.5 text-left`}
    classList={{
      'text-center': props.align === 'center',
      'text-right': props.align === 'right',
    }}
    onClick={() => props.handleSort(props.column)}
  >
    <div class="inline-flex items-center gap-1">
      {props.children}
      {props.sortDirection === 'ASC' && <IconChevronUp class="size-4" />}
      {props.sortDirection === 'DESC' && <IconChevronDown class="size-4" />}
      {props.sortDirection === undefined && <div class="size-4" />}
    </div>
  </th>
);

export default function ModelList() {
  const [sortColumn, setSortColumn] = createSignal<string>('created');
  const [sortDirection, setSortDirection] = createSignal<'ASC' | 'DESC' | undefined>('DESC');

  const sortedModels = createMemo(() => {
    const _sortColumn = sortColumn();

    return [...models].sort((a, b) => {
      if (_sortColumn === '') return 0;

      let aValue, bValue;

      if (_sortColumn === 'pricing-context') {
        aValue = a.pricing.prompt;
        bValue = b.pricing.prompt;
      } else if (_sortColumn === 'pricing-output') {
        aValue = a.pricing.completion;
        bValue = b.pricing.completion;
      } else if (_sortColumn === 'creator') {
        aValue = a.creator.name;
        bValue = b.creator.name;
      } else {
        aValue = a[_sortColumn as keyof ModelProps];
        bValue = b[_sortColumn as keyof ModelProps];
      }

      if (aValue === undefined || bValue === undefined) return 0;

      if (aValue < bValue) return sortDirection() === 'ASC' ? -1 : 1;
      if (aValue > bValue) return sortDirection() === 'ASC' ? 1 : -1;
      return 0;
    });
  });

  const handleSort = (column: string) => {
    if (sortColumn() === column) {
      setSortDirection((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
    } else {
      setSortColumn(column);
      setSortDirection('ASC');
    }
  };

  return (
    <div class="flex h-full w-full flex-col gap-8 overflow-auto px-10 py-6">
      <div>
        <PageTitle>Models</PageTitle>
        <SectionDescription>
          Models will be updated with new releases of laneway. Please note that the pricing may
          be out of date.
        </SectionDescription>
      </div>
      <div class="container mx-auto">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b">
              <SortableHeader
                column="creator"
                handleSort={handleSort}
                sortDirection={sortColumn() === 'creator' ? sortDirection() : undefined}
              >
                Creator
              </SortableHeader>
              <SortableHeader
                column="title"
                handleSort={handleSort}
                sortDirection={sortColumn() === 'title' ? sortDirection() : undefined}
              >
                Model
              </SortableHeader>
              <SortableHeader
                column="created"
                handleSort={handleSort}
                sortDirection={sortColumn() === 'created' ? sortDirection() : undefined}
                align="right"
              >
                Created
              </SortableHeader>
              <SortableHeader
                column="contextLength"
                handleSort={handleSort}
                sortDirection={sortColumn() === 'contextLength' ? sortDirection() : undefined}
                align="right"
              >
                Context Window
              </SortableHeader>
              <SortableHeader
                column="maxCompletionTokens"
                handleSort={handleSort}
                sortDirection={
                  sortColumn() === 'maxCompletionTokens' ? sortDirection() : undefined
                }
                align="right"
              >
                Max Output
              </SortableHeader>
              <SortableHeader
                column="pricing-context"
                handleSort={handleSort}
                sortDirection={sortColumn() === 'pricing-context' ? sortDirection() : undefined}
                align="right"
              >
                <div class="flex flex-col items-end">
                  <span>Input Cost</span>
                  <span class="text-xs">per million tokens</span>
                </div>
              </SortableHeader>
              <SortableHeader
                column="pricing-output"
                handleSort={handleSort}
                sortDirection={sortColumn() === 'pricing-output' ? sortDirection() : undefined}
                align="right"
              >
                <div class="flex flex-col items-end">
                  <span>Output Cost</span>
                  <span class="text-xs">per million tokens</span>
                </div>
              </SortableHeader>
            </tr>
          </thead>
          <tbody>
            <For each={sortedModels()}>
              {(model) => (
                <tr class="border-b">
                  <td class="px-2 py-1.5">
                    <div class="flex items-center gap-2">
                      <Avatar>
                        <ModelIcon modelId={model.id} class="size-5" />
                      </Avatar>
                      <a href={model.creator.website} target="_blank" rel="noopener noreferrer">
                        {model.creator.name}
                      </a>
                    </div>
                  </td>
                  <td class="px-2 py-1.5 pl-3">
                    <div class="flex flex-col">
                      <div class="flex items-center gap-2">
                        <span class="font-semibold">{model.title}</span>
                        <div class="flex gap-1">
                          <For each={model.tags}>{(tag) => <Tag variant={tag}>{tag}</Tag>}</For>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-2 py-1.5 pr-7 text-right">
                    {new Date(model.created * 1000).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td class="px-2 py-1.5 pr-7 text-right">
                    {model.contextLength ? model.contextLength.toLocaleString() : 'N/A'}
                  </td>
                  <td class="px-2 py-1.5 pr-7 text-right">
                    {model.maxCompletionTokens
                      ? model.maxCompletionTokens.toLocaleString()
                      : 'N/A'}
                  </td>
                  <td class="py-1.5 pl-2 pr-7 text-right">
                    ${(model.pricing.prompt * 1000000).toFixed(2)}
                  </td>
                  <td class="px-2 py-1.5 pr-7 text-right">
                    ${(model.pricing.completion * 1000000).toFixed(2)}
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
