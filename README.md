# Laneway

Just another AI chat app 🤷‍♂️

- No middleman - connect directly to AI providers with your API keys.
- All data is stored locally in your browser for both speed and privacy.
- Chat with multiple frontier AI models without individual subscriptions, even at the same time!

Head over to <https://laneway.app> to use the app directly.

![Laneway Example](https://files.laneway.app/laneway-main.png)

## Features

- 💬 Chat with multiple AI models in a single session
- 🔊 Text-to-speech support for messages
- 🤖 Create custom assistants
- 🎭 Chat with multiple assistants at once via a "preset"
- 🔌 Supports multiple providers (OpenAI and OpenRouter)
- ⌨️ Command palette
- 🔒 Data stored locally in your browser for privacy & speed
- 📔 Note sessions for iterating on a single prompt

## Building and Running Locally

Both `bun run dev` and `bun run build` fetch model data from
<https://openrouter.ai/api/v1/models>, so they need network access to `openrouter.ai`.
For offline development or builds, save a copy of the raw API response as `models.json`
in the repository root; the scripts use this file instead of fetching.

### Installation

1. Clone the repository:

   ```
   git clone git@github.com:Rkaede/laneway.git
   cd laneway
   ```

2. Install dependencies:

   ```
   bun install
   ```

3. Run the app:

   ```
   bun run dev
   ```

4. Set up your API keys:
   - Open the app and go to the Settings page
   - Enter your API keys for the providers you want to use (OpenAI, OpenRouter)
   - Direct OpenAI access supports selected models and TTS. Gemini and GPT-5.x models require OpenRouter.

### Production Build

Build the app into `dist/`, then preview it locally:

```bash
bun run build
bun run preview
```

### Running Tests

Run the unit tests with Bun:

```bash
bun test
```

Unit tests use `*.test.ts`; Playwright tests use `*.e2e.ts` so Bun does not discover them.

Install Playwright's Chromium browser, then run the end-to-end tests:

```bash
bunx playwright install chromium
bun run test:e2e
```

### Comparing Models

Compare the configured model catalogue with recent OpenRouter models:

```bash
bun scripts/compare-models.ts
```

The script reports missing models without modifying the catalogue. It uses the same
OpenRouter endpoint or local `models.json` described above.
