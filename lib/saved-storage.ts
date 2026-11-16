import { Directory, File, Paths } from 'expo-file-system';

import type { SavedScan, SavedScanMeta, SavedStorage } from '@/types/saved';

/**
 * Native storage: each photo is a JPEG in the app's document directory, which
 * the OS does not clear, and an index.json lists the saved solutions.
 *
 * The index stores file names, not full URIs, because the app container
 * path on iOS can change between app updates.
 */

type StoredRecord = SavedScanMeta & { image: string };
type IndexFile = { version: 1; scans: StoredRecord[] };

const folder = () => new Directory(Paths.document, 'saved-scans');
const indexFile = () => new File(folder(), 'index.json');
const tempIndexFile = () => new File(folder(), 'index.tmp.json');
const imageFile = (name: string) => new File(folder(), name);

let records: StoredRecord[] | null = null;

function ensureFolder() {
  folder().create({ idempotent: true, intermediates: true });
}

async function readIndex(): Promise<StoredRecord[]> {
  // If a previous write was interrupted, the temp file holds the newest index.
  for (const file of [indexFile(), tempIndexFile()]) {
    if (!file.exists) continue;
    try {
      const parsed = JSON.parse(await file.text()) as Partial<IndexFile>;
      if (Array.isArray(parsed.scans)) return parsed.scans;
    } catch {
      // Corrupt file: try the next one.
    }
  }
  return [];
}

/** Write to a temp file first so a crash mid-write never loses the index. */
function writeIndex(next: StoredRecord[]) {
  ensureFolder();
  const body: IndexFile = { version: 1, scans: next };
  const temp = tempIndexFile();
  if (temp.exists) temp.delete();
  temp.create();
  temp.write(JSON.stringify(body));
  const current = indexFile();
  if (current.exists) current.delete();
  temp.move(current);
  records = next;
}

function toScan(record: StoredRecord): SavedScan {
  const { image, ...meta } = record;
  return { ...meta, imageUri: imageFile(image).uri };
}

async function getRecords() {
  if (!records) records = await readIndex();
  return records;
}

export const savedStorage: SavedStorage = {
  async loadAll() {
    const all = await getRecords();
    // Skip any entry whose photo has gone missing.
    return all.filter((r) => imageFile(r.image).exists).map(toScan);
  },

  async add(meta, imageUri) {
    ensureFolder();
    const name = `${meta.id}.jpg`;
    const dest = imageFile(name);
    if (dest.exists) dest.delete();
    new File(imageUri).move(dest);

    const record: StoredRecord = { ...meta, image: name };
    try {
      writeIndex([record, ...(await getRecords()).filter((r) => r.id !== meta.id)]);
    } catch (e) {
      if (dest.exists) dest.delete();
      throw e;
    }
    return toScan(record);
  },

  async remove(id) {
    const all = await getRecords();
    const record = all.find((r) => r.id === id);
    writeIndex(all.filter((r) => r.id !== id));
    if (record) {
      const file = imageFile(record.image);
      if (file.exists) file.delete();
    }
  },

  async clear() {
    const dir = folder();
    if (dir.exists) dir.delete();
    records = [];
  },
};
