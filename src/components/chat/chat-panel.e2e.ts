import { expect, test } from '@playwright/test';

const alertTitle = 'API Key Not Configured';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('laneway-api-keys', JSON.stringify({ openrouter: 'sk-or-test' }));
  });
});

test('does not warn about the key while the model catalogue loads', async ({ page }) => {
  let release = () => {};
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route('**/models.json', async (route) => {
    await held;
    await route.continue();
  });

  await page.goto('/');
  // The panel has rendered, but its model is not known yet.
  await expect(page.getByText('Unknown').first()).toBeVisible();
  await expect(page.getByText(alertTitle)).toHaveCount(0);

  release();
  await expect(page.getByText('Unknown')).toHaveCount(0);
  await expect(page.getByText(alertTitle)).toHaveCount(0);
});

test('does not blame the key when the model catalogue fails to load', async ({ page }) => {
  await page.route('**/models.json', (route) => route.abort());

  await page.goto('/');
  await expect(page.getByText('Unknown').first()).toBeVisible();
  await expect(page.getByText(alertTitle)).toHaveCount(0);
});
