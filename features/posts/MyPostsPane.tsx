import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

/** P3 placeholder. The real list (own posts, thumbnails, delete) lands in P6. */
export function MyPostsPane({ active: _active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.header}>My Posts</Text>
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No capsules yet</Text>
        <Text style={styles.emptyBody}>
          Swipe to the camera to drop your first one at this exact spot.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 20 },
  header: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingBottom: 80 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyBody: {
    color: colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
    paddingHorizontal: 32,
  },
});
