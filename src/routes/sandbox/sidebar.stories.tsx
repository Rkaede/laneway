import type { ParentComponent } from 'solid-js';

import {
  IconChat,
  IconSettings,
  IconSquarePen,
  MoreHorizontalIcon,
} from '~/components/icons/ui';
import {
  SidebarGroup,
  SidebarItem,
  SidebarItems,
  SidebarLinkItem,
} from '~/components/ui/sidebar';
import { noop } from '~/util';

import { Cell, CellHeader, Cells } from './story-components';

const href = '/sandbox/sidebar';
const icon = <IconChat class="mr-2 size-4" />;
const dropdown = <MoreHorizontalIcon class="size-4" />;

const Frame: ParentComponent = (props) => (
  <div class="w-full max-w-60 rounded-md border border-sidebar-border bg-sidebar p-2 text-sidebar-fg">
    {props.children}
  </div>
);

export function Group() {
  return (
    <Frame>
      <SidebarGroup title="Today">
        <SidebarItems>
          <SidebarLinkItem href={href} active>
            Trip to Lisbon
          </SidebarLinkItem>
          <SidebarLinkItem href={href}>Compound interest</SidebarLinkItem>
          <SidebarLinkItem href={href} isLoading>
            Generating a title
          </SidebarLinkItem>
        </SidebarItems>
      </SidebarGroup>
    </Frame>
  );
}

export function ButtonItems() {
  return (
    <Cells class="grid-cols-3">
      <Cell>
        <CellHeader>States</CellHeader>
        <Frame>
          <SidebarItems>
            <SidebarItem onClick={noop}>Default</SidebarItem>
            <SidebarItem onClick={noop} active>
              Active
            </SidebarItem>
          </SidebarItems>
        </Frame>
      </Cell>
      <Cell>
        <CellHeader>Sizes</CellHeader>
        <Frame>
          <SidebarItems>
            <SidebarItem onClick={noop} size="md">
              Medium
            </SidebarItem>
            <SidebarItem onClick={noop} size="lg">
              Large
            </SidebarItem>
          </SidebarItems>
        </Frame>
      </Cell>
      <Cell>
        <CellHeader>Icon and dropdown</CellHeader>
        <Frame>
          <SidebarItems>
            <SidebarItem onClick={noop} icon={<IconSquarePen class="mr-2 size-4" />}>
              New note
            </SidebarItem>
            <SidebarItem
              onClick={noop}
              icon={<IconSettings class="mr-2 size-4" />}
              dropdown={dropdown}
            >
              Settings
            </SidebarItem>
          </SidebarItems>
        </Frame>
      </Cell>
    </Cells>
  );
}

export function LinkItems() {
  return (
    <Cells class="grid-cols-3">
      <Cell>
        <CellHeader>States</CellHeader>
        <Frame>
          <SidebarItems>
            <SidebarLinkItem href={href}>Default</SidebarLinkItem>
            <SidebarLinkItem href={href} active>
              Active
            </SidebarLinkItem>
            <SidebarLinkItem href={href} isLoading>
              Loading
            </SidebarLinkItem>
          </SidebarItems>
        </Frame>
      </Cell>
      <Cell>
        <CellHeader>Icon and dropdown</CellHeader>
        <Frame>
          <SidebarItems>
            <SidebarLinkItem href={href} icon={icon}>
              With icon
            </SidebarLinkItem>
            <SidebarLinkItem href={href} dropdown={dropdown}>
              With dropdown
            </SidebarLinkItem>
            <SidebarLinkItem href={href} dropdown={dropdown} isLoading>
              Loading hides the dropdown
            </SidebarLinkItem>
          </SidebarItems>
        </Frame>
      </Cell>
      <Cell>
        <CellHeader>Long title</CellHeader>
        <Frame>
          <SidebarItems>
            <SidebarLinkItem href={href}>
              A very long chat title that needs to be truncated
            </SidebarLinkItem>
          </SidebarItems>
        </Frame>
      </Cell>
    </Cells>
  );
}
