import { nanoid } from 'nanoid';
import { createSignal } from 'solid-js';

import { getDatabase, scheduleCheckpoint } from '~/db/client';
import {
  addDocument,
  deleteDocuments,
  type DocumentRecord,
  getDocument,
  listDocuments,
} from '~/db/documents';
import { documentFiles } from '~/services/document-files';
import { documentTitle, extractText } from '~/services/text-extraction';
import { download } from '~/util';

import { scheduleIndexing } from './indexer';

const [documentsChanged, setDocumentsChanged] = createSignal(0);

/** Changes whenever documents are added or deleted, here or in another tab. */
export { documentsChanged };

const CHANGED = 'documents-changed';
let channel: BroadcastChannel | undefined;

function announceChange() {
  setDocumentsChanged((count) => count + 1);
  channel?.postMessage(CHANGED);
}

/** Reloads the library when another tab changes it. Called once, when the library first shows. */
function listen() {
  if (channel || typeof BroadcastChannel === 'undefined') return;
  channel = new BroadcastChannel('laneway-library');
  channel.addEventListener('message', (event) => {
    if (event.data === CHANGED) setDocumentsChanged((count) => count + 1);
  });
}

export async function loadDocuments() {
  listen();
  return listDocuments(await getDatabase());
}

export async function loadDocument(id: string) {
  listen();
  return getDocument(await getDatabase(), id);
}

export type AddResult = { added: DocumentRecord[]; failed: { name: string; error: string }[] };

/**
 * Reads each file's text and adds it to the library, keeping the original file too. A file that
 * cannot be read is reported and skipped; the others are still added.
 */
export async function addDocumentFiles(
  files: File[],
  onProgress?: (file: File) => void,
): Promise<AddResult> {
  const result: AddResult = { added: [], failed: [] };
  const db = await getDatabase();
  for (const file of files) {
    onProgress?.(file);
    const id = nanoid();
    try {
      const { text, type } = await extractText(file);
      const record: DocumentRecord = {
        id,
        title: documentTitle(file.name),
        filename: file.name,
        mimeType: type,
        size: file.size,
        created: Date.now(),
      };
      await documentFiles.add(id, new Blob([file], { type }));
      try {
        await addDocument(db, { ...record, text });
      } catch (error) {
        await documentFiles.remove(id).catch(() => {});
        throw error;
      }
      result.added.push(record);
    } catch (error) {
      console.error(`Unable to add ${file.name}.`, error);
      result.failed.push({
        name: file.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  if (result.added.length) {
    await db.syncToFs();
    scheduleCheckpoint();
    // Embeds the new chunks when semantic search is on.
    scheduleIndexing(0);
    announceChange();
  }
  return result;
}

export async function deleteLibraryDocument(id: string) {
  const db = await getDatabase();
  await deleteDocuments(db, [id]);
  await db.syncToFs();
  scheduleCheckpoint();
  await documentFiles.remove(id).catch((error) => {
    console.warn('Unable to remove the original file.', error);
  });
  announceChange();
}

/** Opens a document's original file in a new tab, or downloads it when browsers cannot show it. */
export async function openOriginal(document: DocumentRecord) {
  const blob = await documentFiles.get(document.id);
  if (!blob) throw new Error('The original file is missing from this browser.');
  if (document.mimeType === 'application/pdf' || document.mimeType.startsWith('text/')) {
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener');
    // The new tab has loaded it by then.
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } else {
    download(blob, document.filename);
  }
}
