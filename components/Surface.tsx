import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius } from '@/lib/theme';

/**
 * The single translucent-chrome primitive. All app chrome (mode strip, sheets,
 * cards, overlays) renders through <Surface> so the v2 UI pass can swap its
 * internals for expo-blur `BlurView` (P4) and then `expo-glass-effect`
 * `GlassView` (v2) in ONE place — call sites never change.
 *
 * v1: a translucent dark fill with a hairline border.
 */
export function Surface({
  children,
  style,
  rounded = 'lg',
  bordered = true,
  ...props
}: ViewProps & {
  children?: ReactNode;
  rounded?: keyof typeof radius | number;
  bordered?: boolean;
}) {
  const borderRadius = typeof rounded === 'number' ? rounded : radius[rounded];
  return (
    <View
      style={[
        styles.surface,
        { borderRadius },
        bordered ? styles.bordered : null,
        style as ViewStyle,
      ]}
      {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
