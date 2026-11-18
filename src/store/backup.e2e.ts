import { expect, type Page, test } from '@playwright/test';

/** Waits until the app has saved its default state, then adds sessions as an older version would. */
async function seedSessions(page: Page, titles: string[]) {
  await page.goto('/');
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('chat-store')))
    .not.toBeNull();
  const current = await page.evaluate(() => localStorage.getItem('chat-store'));
  await page.goto('/favicon.svg');
  await page.evaluate(
    ({ serialized, titles }) => {
      const state = JSON.parse(serialized!);
      state.settings.hasSeenWelcome = true;
      titles.forEach((title, index) => {
        const id = `backup-${index}`;
        state.sessions.push({
          id,
          title,
          type: 'chat',
          created: Date.now() - (index + 1) * 86_400_000,
          chats: [`${id}-chat`],
          input: '',
        });
        state.chats.push({
          id: `${id}-chat`,
          status: 'idle',
          modelId: 'openai/gpt-6.1-terra',
          messages: [
            { id: `${id}-q`, role: 'user', content: `${title} question` },
            { id: `${id}-a`, role: 'assistant', content: `${title} reply` },
          ],
        });
      });
      localStorage.setItem('chat-store', JSON.stringify(state));
    },
    { serialized: current, titles },
  );
}

test('exports everything to an archive and imports it, reloading other tabs', async ({
  page,
  context,
}) => {
  const titles = ['Archived 0', 'Archived 1', 'Archived 2', 'Archived 3', 'Archived 4'];
  await seedSessions(page, titles);
  await page.goto('/settings');
  // The oldest sessions leave the snapshot once the database holds them.
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('chat-store')!).chats.some(
          (chat: { unloaded?: boolean }) => chat.unloaded,
        ),
      ),
    )
    .toBe(true);

  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Data' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^laneway-backup-.*\.tar\.gz$/);
  const file = await download.path();
  await expect(page.getByRole('status').filter({ hasText: 'Data exported.' })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete Data' }).click();
  await expect(page.getByRole('link', { name: 'Archived 4' })).toHaveCount(0);

  const other = await context.newPage();
  await other.goto('/settings');
  await expect(other.getByRole('link', { name: 'Archived 4' })).toHaveCount(0);

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByLabel('Backup file').setInputFiles(file);
  // Restoring rebuilds the search dictionary and reopens the store, which takes several seconds
  // when other tests share the machine.
  await expect(page.getByText('Data imported.')).toBeVisible({ timeout: 20_000 });
  for (const title of titles) {
    await expect(page.getByRole('link', { name: title })).toBeVisible();
  }

  // The other tab reloads, rather than saving its out-of-date copy over the import.
  await expect(other.getByRole('link', { name: 'Archived 4' })).toBeVisible();

  await page.getByRole('link', { name: 'Archived 4' }).click();
  await expect(page.getByText('Archived 4 reply')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('link', { name: 'Archived 0' })).toBeVisible();
  await page.goto('/session/backup-3');
  await expect(page.getByText('Archived 3 question')).toBeVisible();
});

test('a tab whose store predates the data takes the data, rather than saving over it', async ({
  page,
}) => {
  // The oldest of four leaves the snapshot once the database holds it.
  await seedSessions(page, ['Kept 0', 'Kept 1', 'Kept 2', 'Kept 3']);
  await page.goto('/settings');
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem('chat-store')!).chats.some(
          (chat: { id: string; unloaded?: boolean }) =>
            chat.id === 'backup-3-chat' && chat.unloaded,
        ),
      ),
    )
    .toBe(true);

  // A snapshot from another generation of the data, which deletes one session and adds another.
  await page.goto('/favicon.svg');
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('chat-store')!);
    state.generation = 'before-an-import';
    state.sessions = state.sessions.filter(
      (session: { id: string }) => session.id !== 'backup-1',
    );
    state.pendingDeletes = ['backup-1'];
    state.sessions.push({
      id: 'ghost',
      title: 'Ghost',
      type: 'chat',
      created: Date.now(),
      chats: [],
      input: '',
    });
    localStorage.setItem('chat-store', JSON.stringify(state));
  });

  await page.goto('/settings');
  await expect(page.getByRole('link', { name: 'Kept 1' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ghost' })).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('chat-store')!).generation))
    .toBeUndefined();

  await page.reload();
  await expect(page.getByRole('link', { name: 'Kept 1' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ghost' })).toHaveCount(0);
});
