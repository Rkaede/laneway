import { expect, test } from '@playwright/test';

// basic smoke test for the welcome screen
test('home page displays welcome heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Laneway' })).toBeVisible();
});
