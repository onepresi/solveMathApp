import { prepareImageForUpload } from '@/lib/prepare-image';
import type { PickedPhoto } from '@/hooks/use-photo-picker';
import type { SolveErrorBody, SolveRequestBody, SolveResult } from '@/types/solution';

/**
 * Sends a photo to our own /api/solve route. The OpenAI key lives only on the
 * server; the app never sees it. In development, relative URLs resolve to the
 * Expo dev server automatically. For production native builds set the
 * expo-router `origin` in app.json to your deployed server URL.
 */
export async function solvePhoto(photo: PickedPhoto, signal?: AbortSignal): Promise<SolveResult> {
  const { base64, mimeType } = await prepareImageForUpload(photo.uri, photo.width, photo.height);

  const body: SolveRequestBody = { imageBase64: base64, mimeType };

  let res: Response;
  try {
    res = await fetch('/api/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new Error("Couldn't reach the solver. Check your connection and try again.");
  }

  const data = (await res.json().catch(() => null)) as SolveResult | SolveErrorBody | null;

  if (data && 'error' in data) throw new Error(data.error);

  if (!res.ok || !data) {
    // Not our JSON: the route wasn't reached (e.g. 404 from a stale dev server).
    throw new Error(
      __DEV__
        ? `The solve service isn't responding (HTTP ${res.status}). Restart the dev server with "npx expo start" so it loads app/api/solve+api.ts and .env.`
        : `The solve service isn't available right now (HTTP ${res.status}). Please try again later.`
    );
  }
  return data;
}
