import { readFileSync } from 'node:fs';

// Every icon the app exports, as a no-op component. The real module re-exports lucide icons through
// Vite-only import aliases that Bun cannot resolve, so unit tests stub it. Reading the names from
// the source keeps the stub in sync when icons are added.
export function iconsMock() {
  const source = readFileSync(new URL('../components/icons/ui.tsx', import.meta.url), 'utf8');
  const names = [...source.matchAll(/export \{ (?:default as )?(\w+) \}/g)].map(
    (match) => match[1],
  );
  return Object.fromEntries(names.map((name) => [name, () => null]));
}
