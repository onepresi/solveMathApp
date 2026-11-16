import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import type { PickedPhoto } from '@/hooks/use-photo-picker';
import { savedStorage } from '@/lib/saved-storage';
import type { SavedScan } from '@/types/saved';
import type { SolveResult } from '@/types/solution';

/**
 * App-wide state for saved problems, backed by on-device storage.
 * Screens read it with useSavedScans(); writes go through saveScan / deleteScan.
 */

export type SavedState = {
  status: 'loading' | 'ready' | 'error';
  scans: SavedScan[];
  error: string | null;
};

const MAX_DIMENSION = 1600; // sharp enough to re-read handwriting, small on disk

let state: SavedState = { status: 'loading', scans: [], error: null };
const listeners = new Set<() => void>();
let loadPromise: Promise<void> | null = null;
let writeQueue: Promise<unknown> = Promise.resolve();

function setState(next: SavedState) {
  state = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => state;

function load() {
  if (!loadPromise) {
    loadPromise = savedStorage
      .loadAll()
      .then((scans) => {
        setState({ status: 'ready', scans: scans.sort((a, b) => b.savedAt - a.savedAt), error: null });
      })
      .catch((e: unknown) => {
        loadPromise = null; // allow a retry
        setState({ status: 'error', scans: [], error: errorMessage(e, "Couldn't load your saved problems.") });
      });
  }
  return loadPromise;
}

/** Run storage writes one at a time so they never interleave. */
function enqueue<T>(task: () => Promise<T>) {
  const result = writeQueue.then(task);
  writeQueue = result.catch(() => undefined);
  return result;
}

function errorMessage(e: unknown, fallback: string) {
  return e instanceof Error && e.message ? e.message : fallback;
}

export function newScanId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Downscale and JPEG-encode the photo for storage. Returns a temporary URI. */
async function encodeForStorage(photo: PickedPhoto) {
  const context = ImageManipulator.manipulate(photo.uri);
  const longest = Math.max(photo.width, photo.height);
  let { width, height } = photo;
  if (longest > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / longest;
    width = Math.round(photo.width * scale);
    height = Math.round(photo.height * scale);
    context.resize(photo.width >= photo.height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return { uri: saved.uri, width: saved.width || width, height: saved.height || height };
}

/** Subscribe to saved problems. Loads them from storage on first use. */
export function useSavedScans() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    load();
  }, []);
  return snapshot;
}

export function useSavedScan(id: string | undefined) {
  const { status, scans } = useSavedScans();
  return { status, scan: id ? scans.find((s) => s.id === id) : undefined };
}

export async function saveScan(id: string, photo: PickedPhoto, result: SolveResult) {
  await load();
  return enqueue(async () => {
    let image: Awaited<ReturnType<typeof encodeForStorage>>;
    try {
      image = await encodeForStorage(photo);
    } catch {
      throw new Error("Couldn't prepare this photo for saving. Please try again.");
    }
    let scan: SavedScan;
    try {
      scan = await savedStorage.add(
        { id, savedAt: Date.now(), imageWidth: image.width, imageHeight: image.height, result },
        image.uri
      );
    } catch (e) {
      throw new Error(
        Platform.OS === 'web'
          ? "Couldn't save in this browser. Private windows and full storage can block saving."
          : errorMessage(e, "Couldn't save this problem. Your device storage may be full.")
      );
    }
    setState({ ...state, status: 'ready', scans: [scan, ...state.scans.filter((s) => s.id !== id)] });
    return scan;
  });
}

export async function deleteScan(id: string) {
  await load();
  return enqueue(async () => {
    await savedStorage.remove(id);
    const removed = state.scans.find((s) => s.id === id);
    setState({ ...state, scans: state.scans.filter((s) => s.id !== id) });
    if (Platform.OS === 'web' && removed?.imageUri.startsWith('blob:')) URL.revokeObjectURL(removed.imageUri);
  });
}

export async function deleteAllScans() {
  await load();
  return enqueue(async () => {
    await savedStorage.clear();
    if (Platform.OS === 'web') {
      state.scans.forEach((s) => s.imageUri.startsWith('blob:') && URL.revokeObjectURL(s.imageUri));
    }
    setState({ ...state, scans: [] });
  });
}

// ---------------------------------------------------------------------------
// Derived helpers
// ---------------------------------------------------------------------------

/** Total number of individual problems across saved scans. */
export function countProblems(scans: SavedScan[]) {
  return scans.reduce((n, s) => n + s.result.problems.length, 0);
}

/** Text used for searching a saved scan. */
export function searchableText(scan: SavedScan) {
  return scan.result.problems
    .flatMap((p) => [p.question, p.finalAnswer, p.topic, ...p.keyConcepts])
    .join(' ')
    .toLowerCase();
}

const DAY = 24 * 60 * 60 * 1000;

/** "Today", "Yesterday", "Nov 9" or "Nov 9, 2025". */
export function formatSavedDate(ms: number) {
  const date = new Date(ms);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  if (ms >= startOfToday.getTime()) return 'Today';
  if (ms >= startOfToday.getTime() - DAY) return 'Yesterday';
  const sameYear = date.getFullYear() === startOfToday.getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}
