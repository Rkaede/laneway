import { expect, type Page, test } from '@playwright/test';

// Controls that share the field chrome in src/styles/input.css. The composer and ordinary
// buttons have their own look, so they are measured on the page but not checked here.
const FIELDS = ['Select', 'Combobox', 'Dropdown trigger', 'TextArea'];
// A TextArea is taller by design.
const SKIPPED: Record<string, string[]> = { TextArea: ['Height'] };

type Table = Record<string, Record<string, string>>;

// Reads the Measurements table on the Form Controls sandbox page: control name -> metric -> value.
function readMeasurements(page: Page): Promise<Table> {
  return page.locator('table').evaluate((table: HTMLTableElement) => {
    const headings = [...table.tHead!.rows[0]!.cells].map((cell) => cell.textContent ?? '');
    return Object.fromEntries(
      [...table.tBodies[0]!.rows].map((row) => {
        const cells = [...row.cells].map((cell) => cell.textContent ?? '');
        const metrics = Object.fromEntries(
          cells.slice(1).map((value, index) => [headings[index + 1], value]),
        );
        return [cells[0], metrics];
      }),
    );
  });
}

// The metrics in which a field differs from the Input, as "Field Metric: value, not baseline".
function mismatches(table: Table) {
  const baseline = table.Input;
  if (!baseline) return ['The table has no Input row'];

  return FIELDS.flatMap((name) => {
    const row = table[name];
    if (!row) return [`The table has no ${name} row`];
    return Object.entries(baseline)
      .filter(([metric]) => !SKIPPED[name]?.includes(metric))
      .filter(([metric, value]) => row[metric] !== value)
      .map(([metric, value]) => `${name} ${metric}: ${row[metric]}, not ${value}`);
  });
}

test('field controls share the Input chrome in both themes', async ({ page }) => {
  await page.goto('/sandbox/form-controls');
  await expect(page.locator('table tbody tr')).not.toHaveCount(0);
  await expect.poll(async () => mismatches(await readMeasurements(page))).toEqual([]);

  // The table measures again when the theme class on <html> changes.
  const toggle = page.getByRole('button', { name: /^Switch to (dark|light) theme$/ });
  const before = await readMeasurements(page);
  await toggle.click();
  await expect.poll(async () => (await readMeasurements(page)).Input).not.toEqual(before.Input);
  await expect.poll(async () => mismatches(await readMeasurements(page))).toEqual([]);
});
