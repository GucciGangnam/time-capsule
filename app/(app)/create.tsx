import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/AuthProvider';
import {
  MAX_VIDEO_SECONDS,
  pickFromLibrary,
  recordVideo,
  submitPost,
  takePhoto,
  type SelectedMedia,
} from '@/features/posts/media';
import { emitPostsChanged } from '@/features/posts/refreshBus';
import { colors, radius } from '@/lib/theme';

export default function CreatePost() {
  const { lat: latP, lng: lngP } = useLocalSearchParams<{ lat: string; lng: string }>();
  const lat = Number(latP);
  const lng = Number(lngP);
  const { session } = useAuth();
  const uid = session?.user?.id;

  const [body, setBody] = useState('');
  const [media, setMedia] = useState<SelectedMedia | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addMedia(pick: () => Promise<SelectedMedia | null>) {
    setError(null);
    try {
      const m = await pick();
      if (!m) return;
      if (m.kind === 'video' && m.durationMs != null && m.durationMs > MAX_VIDEO_SECONDS * 1000 + 500) {
        setError(`Videos must be ${MAX_VIDEO_SECONDS} seconds or shorter.`);
        return;
      }
      setMedia(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add that media.');
    }
  }

  async function onSubmit() {
    setError(null);
    if (!body.trim() && !media) {
      setError('Add a few words or a photo/video.');
      return;
    }
    if (!uid || Number.isNaN(lat) || Number.isNaN(lng)) {
      setError('Lost your location — close and try again.');
      return;
    }
    setBusy(true);
    try {
      await submitPost(uid, { lat, lng }, body, media);
      emitPostsChanged();
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.close}>Cancel</Text>
          </Pressable>
          <Text style={styles.title}>New capsule</Text>
          <View style={{ width: 56 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.locPill}>
            <Text style={styles.locText}>📍 Pinned to this exact spot</Text>
          </View>

          <TextInput
            style={styles.input}
            value={body}
            onChangeText={setBody}
            placeholder="Leave a note at this spot…"
            placeholderTextColor={colors.textFaint}
            multiline
            maxLength={500}
          />

          {media ? (
            <View style={styles.preview}>
              {media.kind === 'photo' ? (
                <Image source={{ uri: media.uri }} style={styles.previewMedia} contentFit="cover" />
              ) : (
                <View style={[styles.previewMedia, styles.videoCard]}>
                  <Text style={styles.videoIcon}>🎬</Text>
                  <Text style={styles.videoMeta}>
                    Video{media.durationMs ? ` · ${Math.round(media.durationMs / 1000)}s` : ''}
                  </Text>
                </View>
              )}
              <Pressable style={styles.removeBtn} onPress={() => setMedia(null)} hitSlop={8}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.mediaRow}>
              <MediaButton label="📷 Take photo" onPress={() => addMedia(takePhoto)} />
              <MediaButton label="🎬 Record" onPress={() => addMedia(recordVideo)} />
              <MediaButton label="🖼 Library" onPress={() => addMedia(pickFromLibrary)} />
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <Pressable
          style={[styles.submit, busy && styles.submitDisabled]}
          onPress={onSubmit}
          disabled={busy}>
          {busy ? (
            <ActivityIndicator color={colors.bg} />
          ) : (
            <Text style={styles.submitText}>Drop capsule</Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MediaButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.mediaBtn, pressed && { opacity: 0.6 }]}
      onPress={onPress}>
      <Text style={styles.mediaBtnText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  close: { color: colors.textDim, fontSize: 16, width: 56 },
  title: { color: colors.text, fontSize: 17, fontWeight: '700' },
  scroll: { padding: 20, gap: 16 },
  locPill: {
    alignSelf: 'flex-start',
    backgroundColor: colors.elevated,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  locText: { color: colors.textDim, fontSize: 13 },
  input: {
    minHeight: 120,
    color: colors.text,
    fontSize: 18,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  mediaRow: { flexDirection: 'row', gap: 10 },
  mediaBtn: {
    flex: 1,
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  mediaBtnText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  preview: { gap: 10 },
  previewMedia: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, backgroundColor: colors.elevated },
  videoCard: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  videoIcon: { fontSize: 44 },
  videoMeta: { color: colors.textDim, fontSize: 15 },
  removeBtn: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 16 },
  removeText: { color: colors.danger, fontSize: 15, fontWeight: '600' },
  error: { color: colors.danger, fontSize: 14 },
  submit: {
    margin: 20,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
});
