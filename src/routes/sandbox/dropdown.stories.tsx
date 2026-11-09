import { IconCopy, IconDownload, IconTrash, MoreHorizontalIcon } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown';

import { Cell, CellHeader, Cells } from './story-components';

export function Triggers() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Button</CellHeader>
        <DropdownMenu>
          <DropdownMenuTrigger as={Button} variant="outline">
            Open menu
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Cell>
      <Cell>
        <CellHeader>Icon button</CellHeader>
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button}
            variant="ghost"
            size="icon"
            aria-label="More actions"
          >
            <MoreHorizontalIcon class="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuItem>Rename</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </Cell>
    </Cells>
  );
}

export function ItemStates() {
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} variant="outline">
          Icons and disabled items
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <IconCopy class="mr-2 size-4" />
              Copy
            </DropdownMenuItem>
            <DropdownMenuItem disabled>
              <IconDownload class="mr-2 size-4" />
              Download (disabled)
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuGroup>
            <DropdownMenuItem class="text-danger">
              <IconTrash class="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
