import { Pressable, StyleSheet, Text } from 'react-native';

import { Surface } from '@/components/Surface';
import { colors } from '@/lib/theme';

export const MODES = ['Posts', 'Camera', 'Settings'] as const;

/** The iOS-Camera-style mode selector. Tapping a label switches panes; the
 *  active label is highlighted. Swiping the pager updates `index` live. */
export function ModeStrip({
  index,
  onSelect,
}: {
  index: number;
  onSelect: (i: number) => void;
}) {
  return (
    <Surface rounded="pill" style={styles.wrap}>
      {MODES.map((label, i) => (
        <Pressable key={label} onPress={() => onSelect(i)} style={styles.item} hitSlop={6}>
          <Text style={[styles.label, i === index && styles.active]}>{label}</Text>
        </Pressable>
      ))}
    </Surface>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 4 },
  item: { paddingHorizontal: 18, paddingVertical: 9 },
  label: {
    color: colors.textFaint,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  active: { color: colors.accent },
});
