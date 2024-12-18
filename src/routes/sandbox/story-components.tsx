import { JSX } from 'solid-js';

export function Cell(props: { children?: JSX.Element }) {
  return (
    <div class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">{props.children}</div>
    </div>
  );
}

export function CellHeader(props: { children?: JSX.Element }) {
  return <div class="mb-4 font-medium">{props.children}</div>;
}
