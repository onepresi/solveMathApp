import type { SolveResult } from '@/types/solution';

/** A scanned photo and its full solution, saved on this device. */
export type SavedScan = {
  id: string;
  /** Unix time in milliseconds. */
  savedAt: number;
  /** Displayable image URI. Resolved at load time; never persisted as-is. */
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  result: SolveResult;
};

/** Everything except the image, which storage keeps separately. */
export type SavedScanMeta = Omit<SavedScan, 'imageUri'>;

export type SavedStorage = {
  loadAll(): Promise<SavedScan[]>;
  /** Persist the scan. `imageUri` points to a freshly encoded JPEG the storage may take ownership of. */
  add(meta: SavedScanMeta, imageUri: string): Promise<SavedScan>;
  remove(id: string): Promise<void>;
  clear(): Promise<void>;
};
