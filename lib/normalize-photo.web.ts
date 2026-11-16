import type { ImagePickerAsset } from 'expo-image-picker';

import { PhotoFormatError, type NormalizedPhoto } from '@/lib/normalize-photo.types';

export { PhotoFormatError };

function measure(uri: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new PhotoFormatError("This photo couldn't be opened. Please try a JPEG or PNG."));
    img.src = uri;
  });
}

/**
 * Web: browsers other than Safari can't display HEIC/HEIF, the default iPhone
 * photo format. The picker reports 0×0 for any image the browser can't decode.
 * In that case, convert HEIC to JPEG in the browser so the preview shows and
 * the photo can be uploaded.
 */
export async function normalizePickedAsset(asset: ImagePickerAsset): Promise<NormalizedPhoto> {
  if (asset.width > 0 && asset.height > 0) {
    return { uri: asset.uri, width: asset.width, height: asset.height };
  }

  const file = asset.file;
  if (!file) throw new PhotoFormatError("This photo couldn't be opened. Please try a JPEG or PNG.");

  // Loaded on demand: the converter is large and only needed for HEIC files.
  const { heicTo, isHeic } = await import('heic-to');

  const name = asset.fileName ?? file.name ?? '';
  const looksHeic =
    /hei[cf]/i.test(asset.mimeType ?? file.type ?? '') || /\.hei[cf]$/i.test(name) || (await isHeic(file));

  if (!looksHeic) {
    throw new PhotoFormatError("This image format isn't supported. Please use a JPEG or PNG photo.");
  }

  let jpeg: Blob;
  try {
    jpeg = await heicTo({ blob: file, type: 'image/jpeg', quality: 0.92 });
  } catch {
    throw new PhotoFormatError("This HEIC photo couldn't be converted. Please export it as JPEG and try again.");
  }

  const uri = URL.createObjectURL(jpeg);
  const { width, height } = await measure(uri);
  return { uri, width, height };
}
