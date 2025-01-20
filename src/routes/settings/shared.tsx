import { JSX, ParentComponent } from 'solid-js';

import {
  Card,
  CardContent,
  SectionDescription,
  SectionTitle,
  SettingDescription,
  SettingHeader,
  SettingTitle,
} from '~/components/ui';

type SectionProps = {
  title?: JSX.Element;
  description?: JSX.Element;
  anchor?: string;
};

export const Section: ParentComponent<SectionProps> = (props) => {
  return (
    <form class="container mx-auto flex flex-col gap-1">
      <div class="pb-2 pl-2">
        <SectionTitle id={props.anchor}>{props.title}</SectionTitle>
        <SectionDescription>{props.description}</SectionDescription>
      </div>
      <SectionContent>{props.children}</SectionContent>
    </form>
  );
};

const SectionContent: ParentComponent = (props) => (
  <Card class="">
    <CardContent class="flex flex-col gap-8 pb-8 pt-6">{props.children}</CardContent>
  </Card>
);

export const SettingControl: ParentComponent = (props) => {
  return <div class="flex justify-end">{props.children}</div>;
};

type SettingProps = {
  inline?: boolean;
  title?: string;
  description?: JSX.Element;
};

export const Setting: ParentComponent<SettingProps> = (props) => {
  return (
    <div
      classList={{
        'grid grid-cols-[1fr_130px] items-center': props.inline,
        'flex flex-col gap-1': !props.inline,
      }}
    >
      <SettingHeader>
        <SettingTitle>{props.title}</SettingTitle>
        <SettingDescription>{props.description}</SettingDescription>
      </SettingHeader>
      {props.children}
    </div>
  );
};
