import { expect, test } from '@playwright/test';

const filler = Array.from({ length: 30 }, (_, i) => ({
  id: `filler-${i}`,
  role: i % 2 === 0 ? 'user' : 'assistant',
  content:
    `Filler message number ${i} with some padding text so the page has to scroll. `.repeat(6),
}));

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async (messages) => {
    const storePath = '/src/store/index.tsx';
    const { setStore, store }: typeof import('./store') = await import(
      /* @vite-ignore */ storePath
    );
    const created = Date.now() - 3 * 86_400_000;
    setStore('chats', [
      ...store.chats,
      {
        id: 'e2e-chat',
        sessionId: 'e2e-session',
        status: 'idle',
        modelId: store.settings.defaultSession.id,
        messages: [
          ...messages,
          { id: 'needle-message', role: 'assistant', content: 'The zebrafish needle is here.' },
        ],
      },
    ] as typeof store.chats);
    setStore('sessions', [
      ...store.sessions,
      {
        id: 'e2e-session',
        title: 'Aquarium notes',
        type: 'chat',
        created,
        chats: ['e2e-chat'],
      },
    ]);
  }, filler);
});

test('lists recent chats and jumps to the matching turn from a search', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByPlaceholder(/Search chats, notes/);
  await expect(input).toBeVisible();
  await expect(page.getByText('Recent chats and notes')).toBeVisible();

  await input.fill('zebrafish');
  await expect(page.getByText('Recent chats and notes')).toHaveCount(0);
  const result = page.getByRole('option', { name: /Aquarium notes/ });
  await expect(result).toBeVisible();
  await expect(result).toContainText('zebrafish');
  await expect(page.getByRole('option')).toHaveCount(1);

  await result.click();
  await expect(page).toHaveURL(/\/session\/e2e-session$/);
  const message = page.locator('[data-message-id="needle-message"]');
  await expect(message).toBeInViewport();
});

test('finds a chat by title and by date', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByPlaceholder(/Search chats, notes/);

  await input.fill('aquarium');
  await expect(page.getByRole('option', { name: /Aquarium notes/ })).toBeVisible();

  await input.fill('aquarium yesterday');
  await expect(page.getByRole('option', { name: /Aquarium notes/ })).toHaveCount(0);
});

test('finds a chat despite a typo or a partial word', async ({ page }) => {
  await page.keyboard.press('ControlOrMeta+k');
  const input = page.getByPlaceholder(/Search chats, notes/);

  await input.fill('zebarfish');
  await expect(page.getByRole('option', { name: /Aquarium notes/ })).toContainText('zebrafish');

  await input.fill('aqua');
  await expect(page.getByRole('option', { name: /Aquarium notes/ })).toBeVisible();
});
