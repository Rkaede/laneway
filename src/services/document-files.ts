/**
 * The original files of library documents, by document id. The database keeps only their text,
 * because PGlite holds its whole data directory in memory.
 */
export const DOCUMENT_FILES_NAME = 'laneway-documents';
const STORE = 'files';

function fileStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DOCUMENT_FILES_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction(STORE, mode);
        const result = operation(transaction.objectStore(STORE));
        transaction.oncomplete = () => {
          db.close();
          resolve(result.result);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error ?? result.error ?? new Error('Document storage aborted'));
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

export const documentFiles = {
  async add(id: string, file: Blob) {
    await fileStore('readwrite', (store) => store.put(file, id));
  },
  async get(id: string): Promise<Blob | null> {
    return (await fileStore<Blob | undefined>('readonly', (store) => store.get(id))) ?? null;
  },
  async remove(id: string) {
    await fileStore('readwrite', (store) => store.delete(id));
  },
  async ids(): Promise<string[]> {
    return (await fileStore('readonly', (store) => store.getAllKeys())).map(String);
  },
  async clearAll() {
    await fileStore('readwrite', (store) => store.clear());
  },
};
