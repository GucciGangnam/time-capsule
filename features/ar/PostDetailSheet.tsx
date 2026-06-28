import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Surface } from '@/components/Surface';
import type { NearbyPost } from '@/features/posts/usePostsWithinRadius';
import { colors } from '@/lib/theme';

/** Tap-a-pin detail: a floating card above the mode strip with the post body,
 *  author, distance, and a like toggle. Tap the backdrop to dismiss. */
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
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <Surface style={[styles.sheet, { bottom: insets.bottom + 74 }]}>
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
  sheet: { position: 'absolute', left: 10, right: 10, padding: 18, gap: 12 },
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
