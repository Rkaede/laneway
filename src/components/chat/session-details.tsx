import type { Component } from 'solid-js';

import type { SessionProps } from '~/types';

type SessionDetailsProps = {
  session: SessionProps;
};

export const SessionDetails: Component<SessionDetailsProps> = (props) => {
  return (
    <div class="mx-auto w-5/12 rounded-2xl px-4 py-3 text-center text-muted-foreground">
      <div class="text-5xl font-bold opacity-70">{props.session.presetTitle}</div>
      <div class="text-sm">{props.session.presetDescription}</div>
    </div>
  );
};
