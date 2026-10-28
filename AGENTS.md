# Agent guidance

Laneway is a local-first AI chat app built with SolidJS, Vite and Tailwind v4. Users bring their
own API keys, and all data stays in the browser.

## Tooling

- Use Bun for everything. There is no pnpm or npm lockfile.
- Lint with oxlint (`bun run lint`) and format with oxfmt (`bun run format`). ESLint and Prettier
  are gone, but keep the `eslint-plugin-*` devDependencies: oxlint loads them as JS plugins.
- `bun run validate` checks formatting, typechecks, lints and runs the unit tests without changing
  any files. Use `bun run format` and `bun run lint:fix` to apply fixes.
- Unit tests are `*.test.ts` files, run with `bun test`. Playwright tests are `*.e2e.ts` files, run
  with `bun run test:e2e`; that needs `bunx playwright install chromium` and a free port 5173.
- Commit messages follow `type: description` (conventional commits). The commit-msg hook in
  `scripts/verify-commit.js` rejects anything else.

## Styling with Loom

The design system lives in `src/styles/`, with `src/styles/loom.css` as its entry point.

- Colour classes come only from Loom. Tailwind's built-in palettes are cleared, so `bg-red-500`,
  `bg-white` and `bg-gray-200` produce nothing. Use a role (`bg-danger`), a surface
  (`bg-surface-raised`) or a palette step (`bg-neutral-3`).
- There is no `dark:` variant. Dark mode is a theme class mounted on `<html>`, so components
  should not need dark overrides.
- Hand-written CSS reads tokens as `var(--surface)`, never `var(--color-surface)`. The `--color-*`
  names resolve once at `:root` and would pin the value to the default theme.
- When you add a radius or spacing token outside Tailwind's stock scale, register it in the
  `extendTailwindMerge` config in `src/util.ts`, or `cn()` will not let stock classes override it.
  `src/util.test.ts` covers this.
- Button variants map to the `.btn-*` classes in `src/styles/button.css`. Buttons space their
  children with a gap, so icons inside a button do not need `mr-2`.

## Themes

- Themes are listed in `THEMES` in `src/constants.ts`. The ids are saved in users' settings, so
  do not rename them. Unknown ids fall back to the first theme.
- Every top-level layout calls `useApplyTheme()` from `src/hooks/use-theme.ts`, because the app
  and the sandbox are separate routes.
- Code highlighting uses Shiki's `css-variables` theme, so code colours come from the
  `--shiki-*` tokens in each theme file under `src/styles/tokens/`.

## AI SDK

The app uses AI SDK 7 (`ai`, `@ai-sdk/openai`).

- Create OpenAI and OpenRouter models with `provider.chat(modelId)`. The default Responses API
  stores conversations server-side and is not supported by OpenRouter.
- Read `fullStream`, not `textStream`. `textStream` hides API failures behind a generic
  `NoOutputGeneratedError`.
- Usage fields are `inputTokens` and `outputTokens`. The mock stream in
  `src/services/llm-mock.ts` must match the shape of the real one.

## State

- Use `makePersistedStore` from `src/store/persisted.ts` rather than calling `makePersisted`
  directly, so the store types are spelled out in one place.

## Model data

- Models are defined in `scripts/data/models/*.ts`. `bun run dev` and `bun run build` merge them
  with OpenRouter's data and write `public/models.json`, along with the presets and assistants.
- To retire a model, set `deprecated: true` instead of deleting it. The command menu and the
  Models page hide it, while old sessions can still resolve it.
- `bun scripts/compare-models.ts` lists recent OpenRouter models from supported providers that
  are not configured yet.

## Sandbox

- The component sandbox is at `/sandbox`. To add a story, create a `*.stories.tsx` file whose
  exports are the stories, then register it in `src/routes/sandbox/stories.ts`.
