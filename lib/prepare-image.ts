import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_DIMENSION = 2000; // plenty for reading handwriting, keeps uploads small

/**
 * Downscale (if needed) and JPEG-encode a photo, returning raw base64.
 * Smaller uploads mean faster, cheaper solves with no loss in legibility.
 */
export async function prepareImageForUpload(uri: string, width: number, height: number) {
  try {
    return await encode(uri, width, height);
  } catch {
    throw new Error("Couldn't process this photo. Please try a different photo (JPEG or PNG works best).");
  }
}

async function encode(uri: string, width: number, height: number) {
  const context = ImageManipulator.manipulate(uri);

  const longest = Math.max(width, height);
  if (longest > MAX_DIMENSION) {
    context.resize(width >= height ? { width: MAX_DIMENSION } : { height: MAX_DIMENSION });
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({ base64: true, compress: 0.8, format: SaveFormat.JPEG });

  if (!result.base64) throw new Error('Could not encode image.');
  // Some platforms return a full data URL. Strip the prefix if present.
  const base64 = result.base64.replace(/^data:image\/\w+;base64,/, '');

  return { base64, mimeType: 'image/jpeg' as const };
}
