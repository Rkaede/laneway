import { expect, test } from '@playwright/test';

const starter = 'Explain compound interest simply';

test('sends new visitors to the welcome page once, then New Chat opens a chat', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('heading', { name: 'Laneway', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'New Chat' }).click();
  const editor = page.getByRole('textbox', { name: 'Chat message input' });
  await expect(editor).toBeVisible();
  await expect(page.getByText('Add an API key to start chatting.')).toBeVisible();

  await page.reload();
  await expect(page).not.toHaveURL(/\/welcome$/);
  await expect(editor).toBeVisible();
});

test('asks for a key on send and sends the kept message once it is saved', async ({ page }) => {
  await page.route('https://openrouter.ai/api/v1/key', (route) =>
    route.fulfill({ status: 200, json: { data: {} } }),
  );
  await page.route('https://openrouter.ai/api/v1/chat/completions', (route) =>
    route.fulfill({ status: 401, json: { error: { message: 'Test key' } } }),
  );
  await page.goto('/welcome');
  await page.getByRole('button', { name: 'Look around first' }).click();

  const editor = page.getByRole('textbox', { name: 'Chat message input' });
  await page.getByRole('button', { name: starter }).click();
  await expect(editor).toHaveText(starter);
  await editor.press('Enter');

  const dialog = page.getByRole('dialog', { name: 'Add an API key' });
  await expect(dialog).toBeVisible();
  await expect(editor).toHaveText(starter);
  await dialog.getByLabel('API key').fill('sk-or-test');
  await expect(dialog.getByText('OpenRouter key. Works with every model.')).toBeVisible();
  await dialog.getByRole('button', { name: 'Save and send' }).click();

  await expect(dialog).toHaveCount(0);
  await expect(page).toHaveURL(/\/session\//);
  await expect(page.getByText(starter).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add API key' })).toHaveCount(0);
});

test('keeps a key the provider rejects out of storage', async ({ page }) => {
  await page.route('https://openrouter.ai/api/v1/key', (route) =>
    route.fulfill({ status: 401, json: { error: { message: 'No auth' } } }),
  );
  await page.goto('/welcome');
  await page.getByLabel('API key').fill('sk-or-bad');
  await page.getByRole('button', { name: 'Save and start' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'OpenRouter rejected this key. Check it and try again.',
  );
  await expect(page).toHaveURL(/\/welcome$/);
  await expect(page.getByRole('button', { name: 'Add API key' })).toBeVisible();
});
