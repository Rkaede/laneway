import { expect, test } from '@playwright/test';

/** A one-page PDF with a line of text per entry, built by hand so the test needs no fixture. */
function makePdf(lines: string[]) {
  const content = [
    'BT /F1 12 Tf 72 720 Td 14 TL',
    ...lines.map((line) => `(${line.replaceAll(/[()\\]/g, '\\$&')}) Tj T*`),
    'ET',
  ].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((object, index) => {
    const offset = pdf.length;
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    return offset;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

test('adds PDF and text documents to the library, shows their text and deletes them', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/library');
  await expect(page.getByText('No documents yet.')).toBeVisible();

  await page.getByLabel('Document files').setInputFiles([
    {
      name: 'Sourdough Guide.pdf',
      mimeType: 'application/pdf',
      buffer: makePdf(['Feed the starter twice a day.', 'Bake at 250 degrees.']),
    },
    {
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Remember the rye flour.'),
    },
    { name: 'photo.png', mimeType: 'image/png', buffer: Buffer.from('not a document') },
  ]);

  await expect(page.getByRole('alert')).toContainText('photo.png: Only PDF, Word');
  const guide = page.getByRole('link', { name: 'Sourdough Guide' });
  await expect(guide).toBeVisible();
  await expect(page.getByRole('link', { name: 'notes' })).toBeVisible();
  await expect(page.getByText(/PDF · \d+ B · Added/)).toBeVisible();

  // The library survives a reload, read back from the database.
  await page.reload();
  await guide.click();
  await expect(page.getByRole('heading', { name: 'Sourdough Guide' })).toBeVisible();
  await expect(page.getByText('Feed the starter twice a day.')).toBeVisible();
  await expect(page.getByText('Bake at 250 degrees.')).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Delete document' }).click();
  await expect(page).toHaveURL(/\/library$/);
  await expect(guide).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'notes' })).toBeVisible();

  await page.getByLabel('Filter documents').fill('nothing like it');
  await expect(page.getByText('No documents match your filter.')).toBeVisible();
  expect(errors).toEqual([]);
});
