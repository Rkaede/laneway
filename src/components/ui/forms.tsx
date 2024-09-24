import type { ParentComponent } from 'solid-js';

import { cn } from '~/util';

export const PageTitle: ParentComponent = (props) => {
  return <h1 class="mb-0.5 text-3xl">{props.children}</h1>;
};

export const SectionTitle: ParentComponent = (props) => {
  return (
    <h2 data-component="SectionTitle" class="flex items-baseline gap-2 text-2xl">
      {props.children}
    </h2>
  );
};

export const SectionDescription: ParentComponent = (props) => {
  return <div>{props.children}</div>;
};

export const SettingHeader: ParentComponent = (props) => {
  return <div class="flex flex-1 flex-col gap-1">{props.children}</div>;
};

export const SettingTitle: ParentComponent = (props) => {
  return <div class="font-medium">{props.children}</div>;
};

export const SettingDescription: ParentComponent<{ class?: string }> = (props) => {
  return <p class={cn('text-sm text-muted-foreground', props.class)}>{props.children}</p>;
};

export const FormContainer: ParentComponent<{ class?: string }> = (props) => {
  return <div class={cn('grid grid-cols-1 gap-4', props.class)}>{props.children}</div>;
};

export const SplitColumns: ParentComponent = (props) => {
  return <div class="grid grid-cols-2 gap-4">{props.children}</div>;
};
