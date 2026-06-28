import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Surface } from '@/components/Surface';
import { mediaPublicUrl } from '@/features/posts/media';
import type { NearbyPost } from '@/features/posts/usePostsWithinRadius';
import { colors, radius } from '@/lib/theme';

/** Tap-a-pin detail: a floating card above the mode strip with the post media,
 *  body, author, distance, and a like toggle. Tap the backdrop to dismiss. */
export function PostDetailSheet({
  post,
  onClose,
  onToggleLike,
}: {
  post: NearbyPost;
  onClose: () => void;
  onToggleLike: () => void;
}) {
  const insets = useSafeAreaInsets();
  const photoUrl = post.type === 'photo' && post.media_path ? mediaPublicUrl(post.media_path) : null;
  const videoUrl = post.type === 'video' && post.media_path ? mediaPublicUrl(post.media_path) : null;

  // Hook must run unconditionally; a null source just means no video.
  const player = useVideoPlayer(videoUrl, (p) => {
    p.loop = true;
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Surface style={[styles.sheet, { bottom: insets.bottom + 74 }]}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.media} contentFit="cover" transition={150} />
        ) : null}
        {videoUrl ? (
          <VideoView style={styles.media} player={player} contentFit="cover" nativeControls allowsFullscreen />
        ) : null}

        <View style={styles.headerRow}>
          <Text style={styles.author}>@{post.author_username}</Text>
          <Text style={styles.distance}>
            {post.distance_m < 1.5 ? 'right here' : `${Math.round(post.distance_m)} m away`}
          </Text>
        </View>
        {post.body ? <Text style={styles.body}>{post.body}</Text> : null}
        <View style={styles.actions}>
          <Pressable onPress={onToggleLike} style={styles.likeBtn} hitSlop={8}>
            <Text style={[styles.heart, post.liked_by_me && styles.heartOn]}>
              {post.liked_by_me ? '♥' : '♡'}
            </Text>
            <Text style={styles.likeCount}>{post.like_count}</Text>
          </Pressable>
        </View>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { position: 'absolute', left: 10, right: 10, padding: 16, gap: 12 },
  media: { width: '100%', height: 200, borderRadius: radius.md, backgroundColor: colors.elevated },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  author: { color: colors.text, fontSize: 17, fontWeight: '700' },
  distance: { color: colors.textDim, fontSize: 13 },
  body: { color: colors.text, fontSize: 16, lineHeight: 22 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 4 },
  heart: { color: colors.textDim, fontSize: 24, lineHeight: 26 },
  heartOn: { color: colors.danger },
  likeCount: { color: colors.text, fontSize: 16, fontWeight: '600' },
});
