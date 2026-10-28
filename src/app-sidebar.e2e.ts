import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  const session = page.getByRole('link', { name: /^Multi-chat / });
  await session.hover();
  await session.getByRole('button', { name: 'Session actions' }).click();
  await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Rename Chat Session' })).toBeVisible();
});

test('keeps the rename draft when an automatic title arrives and submits with Enter', async ({
  page,
}) => {
  const dialog = page.getByRole('dialog', { name: 'Rename Chat Session' });
  const input = dialog.getByRole('textbox');
  await expect(input).toHaveValue('Multi-chat');
  await input.fill('  My custom title  ');

  await page.evaluate(async () => {
    const storePath = '/src/store/index.tsx';
    const { setStore, store }: typeof import('./store') = await import(
      /* @vite-ignore */ storePath
    );
    setStore(
      'sessions',
      (session) => session.id === store.dialogs.renameSession.sessionId,
      'title',
      'Auto-generated title',
    );
  });

  await expect(page.getByText('Auto-generated title', { exact: true })).toBeVisible();
  await expect(input).toHaveValue('  My custom title  ');
  await input.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^My custom title / })).toBeVisible();
});

test('rejects whitespace-only titles and saves a valid title with the button', async ({
  page,
}) => {
  const dialog = page.getByRole('dialog', { name: 'Rename Chat Session' });
  const input = dialog.getByRole('textbox');
  await input.fill('   ');
  await expect(dialog.getByRole('button', { name: 'Rename', exact: true })).toBeDisabled();
  await input.press('Enter');
  await expect(dialog).toBeVisible();

  await input.fill('  Renamed session  ');
  await dialog.getByRole('button', { name: 'Rename', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Renamed session / })).toBeVisible();
});

test('cancels without saving and reopens with the current session title', async ({ page }) => {
  const dialog = page.getByRole('dialog', { name: 'Rename Chat Session' });
  await dialog.getByRole('textbox').fill('Discarded draft');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(dialog).toHaveCount(0);

  const session = page.getByRole('link', { name: /^Multi-chat / });
  await session.hover();
  await session.getByRole('button', { name: 'Session actions' }).click();
  await page.getByRole('menuitem', { name: 'Rename', exact: true }).click();
  await expect(dialog.getByRole('textbox')).toHaveValue('Multi-chat');
});
