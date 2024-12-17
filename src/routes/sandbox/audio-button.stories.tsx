import { AudioButton } from '~/components/ui/audio-button';

export function States() {
  return (
    <div class="grid max-w-md grid-flow-col gap-8 text-sm">
      <div>
        <div>Idle</div>
        <AudioButton status="idle" />
      </div>
      <div>
        <div>Loading</div>
        <AudioButton status="loading" />
      </div>
      <div>
        <div>Playing</div>
        <AudioButton status="playing" />
      </div>
      <div>
        <div>Error</div>
        <AudioButton status="error" />
      </div>
      <div>
        <div>Unavailable</div>
        <AudioButton status="unavailable" />
      </div>
    </div>
  );
}
