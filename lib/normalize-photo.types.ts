export type NormalizedPhoto = { uri: string; width: number; height: number };

/** A photo the app can't display or upload. The message is safe to show to the user. */
export class PhotoFormatError extends Error {
  name = 'PhotoFormatError';
}
