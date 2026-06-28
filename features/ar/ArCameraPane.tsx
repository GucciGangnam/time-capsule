import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

/**
 * P3 placeholder for the AR camera (the default, centered pane). The live
 * camera feed, location gate, and pin projection land in P4. `active` will gate
 * mounting the camera then; unused for now.
 */
export function ArCameraPane({ active: _active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.center}>
        <View style={styles.reticle}>
          <View style={styles.reticleDot} />
        </View>
        <Text style={styles.title}>AR Camera</Text>
        <Text style={styles.subtitle}>
          Point your phone to discover capsules left within 30 m of you.
        </Text>
        <Text style={styles.hint}>Camera & location arrive in the next step.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 14 },
  reticle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  reticleDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  title: { color: colors.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { color: colors.textDim, fontSize: 15, textAlign: 'center', lineHeight: 21 },
  hint: { color: colors.textFaint, fontSize: 13, marginTop: 6 },
});
