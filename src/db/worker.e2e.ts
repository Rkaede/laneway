import { expect, type Page, test } from '@playwright/test';

const CLIENT = '/src/db/client.ts';

/** Runs a transaction in the page's tab of the shared database, held open for `holdMs`. */
function transaction(page: Page, holdMs: number) {
  return page.evaluate(
    async ({ client, holdMs }) => {
      const { getDatabase }: typeof import('./client') = await import(
        /* @vite-ignore */ client
      );
      const db = await getDatabase();
      await db.transaction(async (tx) => {
        await tx.query('select 1');
        await new Promise((resolve) => setTimeout(resolve, holdMs));
      });
      return 'done';
    },
    { client: CLIENT, holdMs },
  );
}

// PGlite 0.5.16 granted the transaction lock to a tab that closed while waiting for it, and never
// released it, so every later transaction hung. patches/@electric-sql%2Fpglite@0.5.16.patch fixes
// that; this fails if an upgrade drops the fix.
test('a tab that closes while waiting for a transaction does not block the others', async ({
  page,
  context,
}) => {
  // The first tab to open the database leads, and runs every tab's queries.
  await page.goto('/favicon.svg');
  await page.evaluate(async (client) => {
    const { getDatabase }: typeof import('./client') = await import(/* @vite-ignore */ client);
    await getDatabase();
  }, CLIENT);
  const follower = await context.newPage();
  await follower.goto('/favicon.svg');

  const holding = transaction(page, 1500);
  // The follower's transaction waits for the leader's, then its tab goes away.
  void transaction(follower, 0).catch(() => {});
  await follower.waitForTimeout(500);
  await follower.close();
  expect(await holding).toBe('done');

  expect(await Promise.race([transaction(page, 0), page.waitForTimeout(5000)])).toBe('done');
});
