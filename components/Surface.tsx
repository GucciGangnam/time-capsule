import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius } from '@/lib/theme';

/**
 * The single translucent-chrome primitive. All app chrome (mode strip, sheets,
 * cards, overlays, the location gate) renders through <Surface>, so the v2 UI
 * pass can swap its internals for `expo-glass-effect` GlassView in ONE place —
 * call sites never change. v1 = expo-blur BlurView with a faint dark tint.
 */
export function Surface({
  children,
  style,
  rounded = 'lg',
  bordered = true,
  intensity = 40,
  ...props
}: ViewProps & {
  children?: ReactNode;
  rounded?: keyof typeof radius | number;
  bordered?: boolean;
  intensity?: number;
}) {
  const borderRadius = typeof rounded === 'number' ? rounded : radius[rounded];
  return (
    <BlurView
      intensity={intensity}
      tint="dark"
      experimentalBlurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      style={[
        styles.surface,
        { borderRadius },
        bordered ? styles.bordered : null,
        style as ViewStyle,
      ]}
      {...props}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  surface: {
    backgroundColor: 'rgba(18,18,24,0.35)', // legibility tint over the blur
    overflow: 'hidden',
  },
  bordered: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
