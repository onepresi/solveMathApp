import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

import { notify } from '@/lib/dialogs';
import { normalizePickedAsset, PhotoFormatError } from '@/lib/normalize-photo';

export type PickedPhoto = {
  uri: string;
  width: number;
  height: number;
  fileName?: string | null;
  source: 'camera' | 'library';
};

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: 'images',
  allowsEditing: true, // lets the user crop to just the problem
  quality: 0.8,
};

/**
 * Take or choose a single photo and keep it in local state.
 * HEIC photos are converted on web so they can be previewed and uploaded.
 */
export function usePhotoPicker() {
  const [photo, setPhoto] = useState<PickedPhoto | null>(null);
  const [busy, setBusy] = useState(false);

  /** Convert the picked asset into something every platform can show and upload. */
  const handleResult = useCallback(
    async (result: ImagePicker.ImagePickerResult, source: PickedPhoto['source']) => {
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      try {
        const { uri, width, height } = await normalizePickedAsset(asset);
        setPhoto({ uri, width, height, fileName: asset.fileName, source });
      } catch (e) {
        notify(
          'Unsupported photo',
          e instanceof PhotoFormatError ? e.message : "This photo couldn't be opened. Please try a JPEG or PNG."
        );
      }
    },
    []
  );

  const takePhoto = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      if (Platform.OS !== 'web') {
        const { granted } = await ImagePicker.requestCameraPermissionsAsync();
        if (!granted) {
          notify('Camera access needed', 'Allow camera access in your device settings to take photos of problems.');
          return;
        }
      }
      let result: ImagePicker.ImagePickerResult;
      try {
        result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
      } catch {
        // e.g. the iOS Simulator has no camera
        notify('Camera unavailable', 'This device has no camera available. Try uploading a photo instead.');
        return;
      }
      await handleResult(result, 'camera');
    } finally {
      setBusy(false);
    }
  }, [busy, handleResult]);

  const pickPhoto = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      let result: ImagePicker.ImagePickerResult;
      try {
        // No permission request needed: the system photo picker runs out of process.
        result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
      } catch {
        notify('Could not open photos', "This file couldn't be opened. Please choose a JPEG, PNG, or HEIC photo.");
        return;
      }
      await handleResult(result, 'library');
    } finally {
      setBusy(false);
    }
  }, [busy, handleResult]);

  const clear = useCallback(() => setPhoto(null), []);

  return { photo, busy, takePhoto, pickPhoto, clear };
}
