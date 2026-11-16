import type { SavedScan, SavedScanMeta, SavedStorage } from '@/types/saved';

/**
 * Web storage: IndexedDB, which can hold image Blobs and far more data than
 * localStorage. Everything stays in this browser on this device.
 */

const DB_NAME = 'solvemath';
const STORE = 'saved-scans';

type StoredRecord = SavedScanMeta & { image: Blob };

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('This browser does not support saving problems.'));
        return;
      }
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(STORE, { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Could not open saved problems.'));
    });
    // Allow a retry after a failure (e.g. storage blocked in a private window).
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = action(tx.objectStore(STORE));
    tx.oncomplete = () => resolve(request.result);
    tx.onerror = () => reject(tx.error ?? new Error('Saved problems storage failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('Saved problems storage failed.'));
  });
}

function toScan({ image, ...meta }: StoredRecord): SavedScan {
  return { ...meta, imageUri: URL.createObjectURL(image) };
}

export const savedStorage: SavedStorage = {
  async loadAll() {
    const all = await run<StoredRecord[]>('readonly', (s) => s.getAll());
    return all.map(toScan);
  },

  async add(meta, imageUri) {
    const image = await (await fetch(imageUri)).blob();
    const record: StoredRecord = { ...meta, image };
    await run('readwrite', (s) => s.put(record));
    return toScan(record);
  },

  async remove(id) {
    await run('readwrite', (s) => s.delete(id));
  },

  async clear() {
    await run('readwrite', (s) => s.clear());
  },
};
