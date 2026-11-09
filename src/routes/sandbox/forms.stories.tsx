import {
  FormContainer,
  PageTitle,
  SectionDescription,
  SectionTitle,
  SettingDescription,
  SettingHeader,
  SettingTitle,
  SplitColumns,
} from '~/components/ui/forms';
import { Input } from '~/components/ui/input';

import { Cell, CellHeader, Cells } from './story-components';

export function Headings() {
  return (
    <Cells>
      <Cell>
        <CellHeader>PageTitle</CellHeader>
        <PageTitle>Settings</PageTitle>
      </Cell>
      <Cell>
        <CellHeader>SectionTitle and SectionDescription</CellHeader>
        <div>
          <SectionTitle>General</SectionTitle>
          <SectionDescription>Options that apply to the whole app.</SectionDescription>
        </div>
      </Cell>
      <Cell>
        <CellHeader>SettingHeader, SettingTitle and SettingDescription</CellHeader>
        <SettingHeader>
          <SettingTitle>Generate titles</SettingTitle>
          <SettingDescription>Name each chat from its first message.</SettingDescription>
        </SettingHeader>
      </Cell>
    </Cells>
  );
}

export function Layout() {
  return (
    <FormContainer class="max-w-2xl">
      <SplitColumns>
        <div>
          <SettingTitle>Name</SettingTitle>
          <Input value="Coding" />
        </div>
        <div>
          <SettingTitle>Description</SettingTitle>
          <Input placeholder="What is it for?" />
        </div>
      </SplitColumns>
      <div>
        <SettingTitle>Full-width field</SettingTitle>
        <SettingDescription>FormContainer stacks its rows with a gap.</SettingDescription>
        <Input class="mt-1" />
      </div>
    </FormContainer>
  );
}
