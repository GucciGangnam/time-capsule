import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export type SelectedMedia = {
  kind: 'photo' | 'video';
  uri: string;
  durationMs: number | null;
  mimeType: string | null;
};

export const MAX_VIDEO_SECONDS = 15;
const MAX_VIDEO_BYTES = 60 * 1024 * 1024; // 60 MB

function assetToMedia(asset: ImagePicker.ImagePickerAsset): SelectedMedia {
  return {
    kind: asset.type === 'video' ? 'video' : 'photo',
    uri: asset.uri,
    durationMs: asset.duration ?? null,
    mimeType: asset.mimeType ?? null,
  };
}

export async function takePhoto(): Promise<SelectedMedia | null> {
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] });
  return res.canceled || !res.assets[0] ? null : assetToMedia(res.assets[0]);
}

export async function recordVideo(): Promise<SelectedMedia | null> {
  const res = await ImagePicker.launchCameraAsync({
    mediaTypes: ['videos'],
    videoMaxDuration: MAX_VIDEO_SECONDS,
  });
  return res.canceled || !res.assets[0] ? null : assetToMedia(res.assets[0]);
}

export async function pickFromLibrary(): Promise<SelectedMedia | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    videoMaxDuration: MAX_VIDEO_SECONDS,
  });
  return res.canceled || !res.assets[0] ? null : assetToMedia(res.assets[0]);
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Uploads media to post-media/{userId}/{uuid} and returns the storage path. */
async function uploadMedia(userId: string, media: SelectedMedia): Promise<string> {
  if (media.kind === 'photo') {
    // Resize + recompress (also strips EXIF as a side effect).
    const out = await ImageManipulator.manipulateAsync(media.uri, [{ resize: { width: 1280 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
      base64: true,
    });
    if (!out.base64) throw new Error('Could not process that photo.');
    const path = `${userId}/${randomId()}.jpg`;
    const { error } = await supabase.storage
      .from('post-media')
      .upload(path, decode(out.base64), { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    return path;
  }

  // Video: no transcode in v1; enforce a size cap from the base64 length.
  const base64 = await FileSystem.readAsStringAsync(media.uri, { encoding: 'base64' });
  if (base64.length * 0.75 > MAX_VIDEO_BYTES) {
    throw new Error('That video is too large — try a shorter clip.');
  }
  const ext = media.mimeType?.includes('quicktime') ? 'mov' : 'mp4';
  const path = `${userId}/${randomId()}.${ext}`;
  const { error } = await supabase.storage
    .from('post-media')
    .upload(path, decode(base64), { contentType: media.mimeType ?? 'video/mp4', upsert: false });
  if (error) throw error;
  return path;
}

/** Uploads any media, then inserts the post at the locked location. */
export async function submitPost(
  userId: string,
  coords: { lat: number; lng: number },
  body: string,
  media: SelectedMedia | null,
): Promise<void> {
  let mediaPath: string | null = null;
  let type: 'text' | 'photo' | 'video' = 'text';
  if (media) {
    mediaPath = await uploadMedia(userId, media);
    type = media.kind;
  }
  const { error } = await supabase.rpc('create_post', {
    lat: coords.lat,
    lng: coords.lng,
    post_type: type,
    body: body.trim() || undefined,
    media_path: mediaPath ?? undefined,
  });
  if (error) throw error;
}

export function mediaPublicUrl(path: string): string {
  return supabase.storage.from('post-media').getPublicUrl(path).data.publicUrl;
}
