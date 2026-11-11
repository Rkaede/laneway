import { createSignal } from 'solid-js';

/** Whether the command menu is open. Lives outside the menu so the sidebar can open it. */
export const [commandMenuOpen, setCommandMenuOpen] = createSignal(false);
