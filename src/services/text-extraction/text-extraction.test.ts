import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { docxText } from './docx';
import { documentTitle, documentType, extractText, MAX_DOCUMENT_SIZE } from './index';
import { readZipEntry } from './zip';

let dir: string;

beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'laneway-docx-'));
});

afterAll(() => rm(dir, { recursive: true, force: true }));

const DOCUMENT_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:pPr><w:tabs><w:tab w:val="left" w:pos="720"/></w:tabs></w:pPr>
      <w:r><w:t>Quarterly </w:t></w:r><w:r><w:t xml:space="preserve">report &amp; plan</w:t></w:r>
    </w:p>
    <w:p><w:r><w:t>Name</w:t><w:tab/><w:t>Value</w:t><w:br/><w:t>Next line &#8212; done</w:t></w:r></w:p>
    <w:tbl><w:tr><w:tc><w:p><w:r><w:t>Cell one</w:t></w:r></w:p></w:tc></w:tr></w:tbl>
    <w:sectPr/>
  </w:body>
</w:document>`;

/** A .docx made by the system's zip tool, stored or deflated. */
async function makeDocx(name: string, { store = false } = {}) {
  const root = join(dir, name);
  await mkdir(join(root, 'word'), { recursive: true });
  await writeFile(join(root, '[Content_Types].xml'), '<Types/>');
  await writeFile(join(root, 'word', 'document.xml'), DOCUMENT_XML);
  const output = join(dir, `${name}.docx`);
  const zip = Bun.spawn(['zip', '-q', '-X', ...(store ? ['-0'] : []), '-r', output, '.'], {
    cwd: root,
  });
  expect(await zip.exited).toBe(0);
  return new Uint8Array(await readFile(output));
}

describe('readZipEntry', () => {
  it('reads deflated and stored entries, and returns null for a missing one', async () => {
    for (const store of [false, true]) {
      const bytes = await makeDocx(store ? 'stored' : 'deflated', { store });
      const entry = await readZipEntry(bytes, 'word/document.xml');
      expect(new TextDecoder().decode(entry!)).toBe(DOCUMENT_XML);
      expect(await readZipEntry(bytes, 'word/missing.xml')).toBeNull();
    }
  });

  it('rejects a file that is not a zip archive', async () => {
    await expect(readZipEntry(new Uint8Array(100), 'any')).rejects.toThrow('not a zip archive');
  });
});

describe('docxText', () => {
  it('reads paragraphs, tabs, breaks, tables and entities, and skips tab stops', async () => {
    expect(await docxText(await makeDocx('document'))).toBe(
      'Quarterly report & plan\nName\tValue\nNext line — done\nCell one',
    );
  });
});

describe('extractText', () => {
  it('reads text and Markdown files', async () => {
    const file = new File(['# Notes\n\nSome text.\0'], 'notes.md');
    expect(await extractText(file)).toEqual({
      text: '# Notes\n\nSome text.',
      type: 'text/markdown',
    });
  });

  it('reads Word documents', async () => {
    const file = new File([await makeDocx('extract')], 'Report.docx');
    const { text, type } = await extractText(file);
    expect(text).toStartWith('Quarterly report & plan');
    expect(type).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
  });

  it('explains why a file cannot be added', async () => {
    await expect(extractText(new File(['x'], 'photo.png'))).rejects.toThrow('Only PDF, Word');
    await expect(extractText(new File([' \n'], 'empty.txt'))).rejects.toThrow('no text');
    const huge = new File(['x'], 'huge.txt');
    Object.defineProperty(huge, 'size', { value: MAX_DOCUMENT_SIZE + 1 });
    await expect(extractText(huge)).rejects.toThrow('over 50 MB');
  });
});

describe('documentType', () => {
  it('goes by extension first, then by type', () => {
    expect(documentType({ name: 'a.PDF', type: '' })).toBe('application/pdf');
    expect(documentType({ name: 'download', type: 'application/pdf' })).toBe('application/pdf');
    expect(documentType({ name: 'a.doc', type: 'application/msword' })).toBeUndefined();
  });
});

describe('documentTitle', () => {
  it('drops the extension', () => {
    expect(documentTitle('Annual Report 2026.pdf')).toBe('Annual Report 2026');
    expect(documentTitle('.env')).toBe('.env');
  });
});
