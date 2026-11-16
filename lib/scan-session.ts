import type { PickedPhoto } from '@/hooks/use-photo-picker';

/**
 * Hands the selected photo from the Dashboard to the Solution screen.
 * Photos are too large for route params, so we keep the current one in memory.
 */
let currentPhoto: PickedPhoto | null = null;

export function setScanPhoto(photo: PickedPhoto) {
  currentPhoto = photo;
}

export function getScanPhoto() {
  return currentPhoto;
}
