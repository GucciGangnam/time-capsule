import { Image } from 'expo-image';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/AuthProvider';
import { mediaPublicUrl } from '@/features/posts/media';
import { useMyPosts, type MyPost } from '@/features/posts/useMyPosts';
import { colors, radius } from '@/lib/theme';
import { useEffect } from 'react';

export function MyPostsPane({ active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  const { session } = useAuth();
  const { posts, remove, refetch } = useMyPosts(session?.user?.id);

  // Refresh like counts etc. when the user swipes to this pane.
  useEffect(() => {
    if (active) refetch();
  }, [active, refetch]);

  function confirmDelete(post: MyPost) {
    Alert.alert('Delete capsule?', 'This permanently removes it for everyone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(post).catch(() => Alert.alert('Could not delete', 'Please try again.'));
        },
      },
    ]);
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.header}>My Posts</Text>
      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No capsules yet</Text>
            <Text style={styles.emptyBody}>
              Swipe to the camera to drop your first one at this exact spot.
            </Text>
          </View>
        }
        renderItem={({ item }) => <Row post={item} onDelete={() => confirmDelete(item)} />}
      />
    </View>
  );
}

function Row({ post, onDelete }: { post: MyPost; onDelete: () => void }) {
  return (
    <View style={styles.row}>
      <Thumb post={post} />
      <View style={styles.rowBody}>
        <Text style={styles.rowText} numberOfLines={2}>
          {post.body ?? labelFor(post.type)}
        </Text>
        <Text style={styles.rowMeta}>
          {timeAgo(post.created_at)}
          {post.like_count > 0 ? `  ·  ♥ ${post.like_count}` : ''}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={10} style={styles.deleteBtn}>
        <Text style={styles.deleteIcon}>🗑️</Text>
      </Pressable>
    </View>
  );
}

function Thumb({ post }: { post: MyPost }) {
  if (post.type === 'photo' && post.media_path) {
    return (
      <Image source={{ uri: mediaPublicUrl(post.media_path) }} style={styles.thumb} contentFit="cover" />
    );
  }
  return (
    <View style={[styles.thumb, styles.thumbIcon]}>
      <Text style={styles.thumbEmoji}>{post.type === 'video' ? '🎬' : '✍️'}</Text>
    </View>
  );
}

function labelFor(type: MyPost['type']): string {
  return type === 'photo' ? 'Photo' : type === 'video' ? 'Video' : 'Note';
}

function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  header: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 12 },
  list: { paddingBottom: 120, gap: 10, flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.elevated,
    borderRadius: radius.md,
    padding: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: radius.sm, backgroundColor: colors.surfaceSolid },
  thumbIcon: { alignItems: 'center', justifyContent: 'center' },
  thumbEmoji: { fontSize: 24 },
  rowBody: { flex: 1, gap: 4 },
  rowText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  rowMeta: { color: colors.textFaint, fontSize: 12 },
  deleteBtn: { padding: 8 },
  deleteIcon: { fontSize: 18 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 80 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyBody: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 32,
  },
});
