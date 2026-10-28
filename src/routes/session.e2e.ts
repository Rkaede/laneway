import { expect, test } from '@playwright/test';

for (const type of ['chat', 'note'] as const) {
  test(`switching ${type} sessions isolates drafts and attachments`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('heading', { name: 'Laneway', exact: true }).waitFor();
    await page.evaluate(async (type) => {
      const storePath = '/src/store/index.tsx';
      const { setStore }: typeof import('../store') = await import(
        /* @vite-ignore */ storePath
      );
      setStore(
        'sessions',
        ['a', 'b'].map((id) => ({
          id,
          title: `Session ${id.toUpperCase()}`,
          type,
          created: -1,
          chats: [`chat-${id}`],
          input: `Draft ${id.toUpperCase()}`,
        })),
      );
      setStore(
        'chats',
        ['a', 'b'].map((id) => ({
          id: `chat-${id}`,
          modelId: 'openai/gpt-4o',
          messages: [],
          status: 'idle',
        })),
      );
    }, type);

    await page.getByRole('link', { name: /^Session A / }).click();
    const editor = page.getByRole('textbox', {
      name: type === 'note' ? 'Note input' : 'Chat message input',
    });
    await expect(editor).toHaveText('Draft A');

    if (type === 'chat') {
      await page.locator('input[type="file"]').setInputFiles({
        name: 'session-a.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6rRYAAAAASUVORK5CYII=',
          'base64',
        ),
      });
      await expect(page.getByAltText('session-a.png')).toBeVisible();
    }

    await page.getByRole('link', { name: /^Session B / }).click();
    await expect(editor).toHaveText('Draft B');
    await expect(page.getByAltText('session-a.png')).toHaveCount(0);
    await editor.click();
    await editor.press('End');
    await editor.pressSequentially(' edited');
    await expect(editor).toHaveText('Draft B edited');

    await page.goBack();
    await expect(editor).toHaveText('Draft A');
    await expect(page.getByAltText('session-a.png')).toHaveCount(0);
    await page.goForward();
    await expect(editor).toHaveText('Draft B edited');
  });
}
