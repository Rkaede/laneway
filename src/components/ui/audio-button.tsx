import { Match, Switch } from 'solid-js';

import { IconLoaderCircle, IconSpeaker, IconVolumeX } from '../icons/ui';
import { Button } from './button';

interface AudioButtonProps {
  text?: string;
  id?: string;
  onClick?: () => void;
  status: 'idle' | 'loading' | 'playing' | 'error' | 'unavailable';
}

export function AudioButton(props: AudioButtonProps) {
  return (
    <Button
      variant="toolbar"
      size="toolbar"
      onClick={props.onClick}
      disabled={props.status === 'loading' || props.status === 'unavailable'}
      classList={{
        'disabled:opacity-100': props.status === 'loading',
        'bg-muted/50': props.status === 'playing',
      }}
      title={props.status === 'unavailable' ? 'OpenAI API key is required' : undefined}
    >
      <Switch fallback={<IconSpeaker class="size-4" />}>
        <Match when={props.status === 'playing'}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="size-4"
          >
            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
            <path class="animate-wave-1 opacity-0" d="M16 9a5 5 0 0 1 0 6" />
            <path class="animate-wave-2 opacity-0" d="M19.364 18.364a9 9 0 0 0 0-12.728" />
          </svg>
        </Match>
        <Match when={props.status === 'loading'}>
          <IconLoaderCircle class="size-4 animate-spin" />
        </Match>
        <Match when={props.status === 'error'}>
          <IconVolumeX class="size-4" />
        </Match>
      </Switch>
    </Button>
  );
}
