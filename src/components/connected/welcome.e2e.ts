import { test, expect } from '@playwright/test';

// Basic smoke test for the welcome screen
test('home page displays welcome heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Laneway' })).toBeVisible();
});
