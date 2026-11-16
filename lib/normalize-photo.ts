import type { ImagePickerAsset } from 'expo-image-picker';

import { PhotoFormatError, type NormalizedPhoto } from '@/lib/normalize-photo.types';

export { PhotoFormatError };

/**
 * Native: iOS and Android decode HEIC themselves, and the photo is re-encoded
 * as JPEG before upload (see prepare-image.ts). Nothing to convert here.
 * The web version (normalize-photo.web.ts) handles HEIC in the browser.
 */
export async function normalizePickedAsset(asset: ImagePickerAsset): Promise<NormalizedPhoto> {
  return { uri: asset.uri, width: asset.width, height: asset.height };
}
