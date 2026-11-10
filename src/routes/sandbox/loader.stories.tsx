import { Loader } from '~/components/ui/loader';
import { StreamCursor } from '~/components/ui/stream-cursor';

export function Default() {
  return (
    <div>
      <Loader />
    </div>
  );
}

export function SquareCursor() {
  return <StreamCursor shape="square" />;
}

export function CircleCursor() {
  return <StreamCursor shape="circle" />;
}
