import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Surface } from '@/components/Surface';
import type { NearbyPost } from '@/features/posts/usePostsWithinRadius';
import type { Projection } from '@/lib/geo';
import { colors } from '@/lib/theme';

const ICON: Record<NearbyPost['type'], string> = {
  text: '✍️',
  photo: '📷',
  video: '🎬',
};

const BUBBLE = 52;

export function Pin({
  post,
  projection,
  onPress,
}: {
  post: NearbyPost;
  projection: Projection;
  onPress: () => void;
}) {
  if (!projection.onScreen) return <EdgeArrow projection={projection} />;

  // Nearer pins are more opaque; far ones fade toward the radius edge.
  const opacity = 0.5 + 0.5 * (1 - Math.min(1, post.distance_m / 30));

  return (
    <>
      <Pressable
        onPress={onPress}
        hitSlop={10}
        style={[styles.bubbleWrap, { left: projection.x - BUBBLE / 2, top: projection.y - BUBBLE / 2, opacity }]}>
        <Surface rounded="pill" style={styles.bubble}>
          <Text style={styles.icon}>{ICON[post.type]}</Text>
        </Surface>
      </Pressable>
      <View style={[styles.labelWrap, { left: projection.x - 50, top: projection.y + BUBBLE / 2 + 4 }]} pointerEvents="none">
        <Surface rounded="pill" style={styles.label}>
          <Text style={styles.labelText}>
            {formatDistance(post.distance_m)}
            {post.like_count > 0 ? `  ♥ ${post.like_count}` : ''}
          </Text>
        </Surface>
      </View>
    </>
  );
}

function EdgeArrow({ projection }: { projection: Projection }) {
  const isLeft = projection.edge === 'left';
  return (
    <View
      style={[styles.edge, { top: projection.y - 18 }, isLeft ? styles.edgeLeft : styles.edgeRight]}
      pointerEvents="none">
      <Surface rounded="pill" style={styles.edgeBubble}>
        <Text style={styles.edgeText}>{isLeft ? '‹' : '›'}</Text>
      </Surface>
    </View>
  );
}

function formatDistance(m: number): string {
  if (m < 1.5) return 'here';
  return `${Math.round(m)} m`;
}

const styles = StyleSheet.create({
  bubbleWrap: { position: 'absolute', width: BUBBLE, height: BUBBLE },
  bubble: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 24 },
  labelWrap: { position: 'absolute', width: 100, alignItems: 'center' },
  label: { paddingHorizontal: 10, paddingVertical: 4 },
  labelText: { color: colors.text, fontSize: 12, fontWeight: '600' },
  edge: { position: 'absolute' },
  edgeLeft: { left: 8 },
  edgeRight: { right: 8 },
  edgeBubble: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  edgeText: { color: colors.accent, fontSize: 22, fontWeight: '800', lineHeight: 24 },
});
