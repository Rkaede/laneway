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
- 🔌 Supports multiple providers (OpenAI, Google, and OpenRouter)
- ⌨️ Command palette
- 🔒 Data stored locally in your browser for privacy & speed
- 📔 Note sessions for iterating on a single prompt

## Building and Running Locally

### Installation

1. Clone the repository:

   ```
   git clone git@github.com:Rkaede/laneway.git
   cd laneway
   ```

2. Install dependencies:

   ```
   npm install
   ```

   or

   ```
   bun install
   ```

3. Run the app:

   ```
   npm run dev
   ```

   or

   ```
   bun run dev
   ```

4. Set up your API keys:
   - Open the app and go to the Settings page
   - Enter your API keys for the providers you want to use (OpenAI, Google, OpenRouter)
