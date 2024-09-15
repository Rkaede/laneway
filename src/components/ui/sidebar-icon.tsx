import './sidebar-icon.css';

import type { Component } from 'solid-js';

const lineLength = 10;
const overlap = 1;
const py = 2;
const x = 10;

export const SidebarIcon: Component<{ open?: boolean }> = (props) => {
  return (
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
      class="sidebar-icon"
      data-open={props.open}
      {...props}
    >
      <line class="sidebar-icon-top" x1={x} y1="2" x2={x} y2={py + lineLength - overlap} />
      <line
        class="sidebar-icon-bottom"
        x1={x}
        y1={py + lineLength - overlap}
        x2={x}
        y2={py + py * lineLength - py * overlap}
      />
    </svg>
  );
};
