import { expect, test } from '@playwright/test';

type SavedChat = { id: string; messages: unknown[]; unloaded?: boolean };

const snapshot = async (page: import('@playwright/test').Page) =>
  JSON.parse((await page.evaluate(() => localStorage.getItem('chat-store'))) ?? 'null') as {
    chats: SavedChat[];
  } | null;

test('moves chat history from localStorage into the database and loads old chats on demand', async ({
  page,
}) => {
  // Let the app write its default state, then turn it into a save from before the database, which
  // kept every message in localStorage.
  await page.goto('/');
  await expect.poll(() => snapshot(page)).not.toBeNull();
  const current = await page.evaluate(() => localStorage.getItem('chat-store'));

  await page.goto('/favicon.svg');
  await page.evaluate((serialized) => {
    const state = JSON.parse(serialized!);
    state.settings.hasSeenWelcome = true;
    const day = 86_400_000;
    for (let index = 0; index < 10; index++) {
      const chatId = `old-chat-${index}`;
      state.sessions.push({
        id: `old-${index}`,
        title: `Old chat ${index}`,
        type: 'chat',
        created: Date.now() - (index + 1) * day,
        chats: [chatId],
        input: '',
      });
      state.chats.push({
        id: chatId,
        sessionId: `old-${index}`,
        status: 'idle',
        modelId: 'openai/gpt-6.1-terra',
        messages: [
          { id: `old-${index}-q`, role: 'user', content: `Old ${index} question` },
          { id: `old-${index}-a`, role: 'assistant', content: `Old ${index} reply` },
        ],
      });
    }
    localStorage.setItem('chat-store', JSON.stringify(state));
  }, current);

  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Old chat 9' })).toBeVisible();

  // Once the database holds them, older chats leave localStorage. The newest stay for instant opens.
  await expect
    .poll(async () => (await snapshot(page))?.chats.find((chat) => chat.id === 'old-chat-9'))
    .toMatchObject({ messages: [], unloaded: true });
  const newest = (await snapshot(page))?.chats.find((chat) => chat.id === 'old-chat-0');
  expect(newest?.messages).toHaveLength(2);

  // A cold start on an old chat reads its messages from the database.
  await page.goto('/session/old-9');
  await expect(page.getByText('Old 9 reply')).toBeVisible();
  await expect(page.getByText('Old 9 question')).toBeVisible();
});
