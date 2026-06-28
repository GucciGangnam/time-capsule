import type { ReactNode } from 'react';
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
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Auth screens use a fixed light palette for v1. The themed <Surface> pass
// (Liquid Glass) comes later — see IMPLEMENTATION_PLAN.md §10.
const COLORS = {
  bg: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  borderFocus: '#111827',
  danger: '#dc2626',
  success: '#16a34a',
  primary: '#111827',
};

export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function TextField({
  label,
  error,
  hint,
  ...props
}: TextInputProps & { label: string; error?: string | null; hint?: ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholderTextColor={COLORS.muted}
        {...props}
      />
      {hint}
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function Button({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.buttonPrimary : styles.buttonGhost,
        isDisabled ? styles.buttonDisabled : null,
        pressed && !isDisabled ? styles.buttonPressed : null,
      ]}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : COLORS.text} />
      ) : (
        <Text style={[styles.buttonText, variant === 'ghost' ? styles.buttonTextGhost : null]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.formError}>{message}</Text>;
}

export const authColors = COLORS;

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  header: { gap: 8 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, color: COLORS.text },
  subtitle: { fontSize: 16, color: COLORS.muted },
  body: { gap: 16 },
  footer: { gap: 12, alignItems: 'center', marginTop: 8 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: COLORS.danger },
  fieldError: { fontSize: 13, color: COLORS.danger },
  formError: { fontSize: 14, color: COLORS.danger, textAlign: 'center' },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonPrimary: { backgroundColor: COLORS.primary },
  buttonGhost: { backgroundColor: 'transparent' },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { opacity: 0.8 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  buttonTextGhost: { color: COLORS.text },
});
