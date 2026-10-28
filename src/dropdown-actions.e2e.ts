import { expect, type Locator, test } from '@playwright/test';

for (const input of ['Enter', 'Space', 'click'] as const) {
  async function selectItem(item: Locator) {
    if (input === 'click') {
      await item.click();
    } else {
      await item.focus();
      await item.press(input);
    }
  }

  test(`session Rename responds to ${input}`, async ({ page }) => {
    await page.goto('/');
    const session = page.getByRole('link', { name: /^Multi-chat / });
    await session.hover();
    await session.getByRole('button', { name: 'Session actions' }).click();
    await selectItem(page.getByRole('menuitem', { name: 'Rename', exact: true }));

    const dialog = page.getByRole('dialog', { name: 'Rename Chat Session' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('textbox').fill('Renamed session');
    await dialog.getByRole('button', { name: 'Rename', exact: true }).click();
    await expect(page.getByRole('link', { name: /^Renamed session / })).toBeVisible();
  });

  test(`session Delete responds to ${input}`, async ({ page }) => {
    await page.goto('/');
    const session = page.getByRole('link', { name: /^Multi-chat / });
    await session.hover();
    await session.getByRole('button', { name: 'Session actions' }).click();
    page.once('dialog', (dialog) => dialog.accept());
    await selectItem(page.getByRole('menuitem', { name: 'Delete', exact: true }));
    await expect(session).toHaveCount(0);
  });

  for (const type of ['assistant', 'preset'] as const) {
    test(`${type} Delete responds to ${input} without opening the editor`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('heading', { name: 'Laneway', exact: true }).waitFor();
      if (type === 'assistant') {
        await page.evaluate(async () => {
          const storePath = '/src/store/index.tsx';
          const { setStore }: typeof import('./store') = await import(
            /* @vite-ignore */ storePath
          );
          setStore('assistants', [
            { id: 'nv5-assistant', title: 'Test assistant', modelId: 'openai/gpt-4o' },
          ]);
        });
      }
      await page
        .getByRole('link', { name: type === 'assistant' ? 'Assistants' : 'Presets' })
        .click();
      const title = type === 'assistant' ? 'Test assistant' : 'Daily Driver';
      const card = page.getByRole('button').filter({
        has: page.getByRole('heading', { name: title }),
      });
      await card.getByRole('button').click();
      await selectItem(page.getByRole('menuitem', { name: 'Delete', exact: true }));

      const dialog = page.getByRole('dialog', { name: 'Confirm Deletion' });
      await expect(dialog).toBeVisible();
      await expect(page.getByRole('dialog')).toHaveCount(1);
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(card).toBeVisible();

      await card.getByRole('button').click();
      await selectItem(page.getByRole('menuitem', { name: 'Delete', exact: true }));
      await dialog.getByRole('button', { name: 'Delete', exact: true }).click();
      await expect(card).toHaveCount(0);
    });
  }
}
