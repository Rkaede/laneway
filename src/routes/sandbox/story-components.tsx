import { JSX } from 'solid-js';

export function Cell(props: { children?: JSX.Element }) {
  return <div class="px-3">{props.children}</div>;
}

export function Cells(props: { children?: JSX.Element }) {
  return <div class="grid auto-cols-fr grid-flow-col">{props.children}</div>;
}

export function CellHeader(props: { children?: JSX.Element }) {
  return <div class="mb-4 font-medium">{props.children}</div>;
}
