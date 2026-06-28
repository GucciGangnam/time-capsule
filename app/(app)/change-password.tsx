import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';
import { colors, radius } from '@/lib/theme';

export default function ChangePassword() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit() {
    setError(null);
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Change password</Text>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.close}>Close</Text>
          </Pressable>
        </View>

        {done ? (
          <View style={styles.doneWrap}>
            <Text style={styles.doneTitle}>Password updated</Text>
            <Text style={styles.doneBody}>Your new password is now active.</Text>
            <Pressable style={[styles.button, styles.buttonPrimary]} onPress={() => router.back()}>
              <Text style={styles.buttonText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <Field
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
            />
            <Field
              label="Confirm new password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter your password"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
              onPress={onSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color={colors.bg} />
              ) : (
                <Text style={styles.buttonText}>Update password</Text>
              )}
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1, padding: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 },
  close: { color: colors.textDim, fontSize: 16, fontWeight: '600' },
  form: { gap: 16, marginTop: 28 },
  field: { gap: 6 },
  label: { color: colors.textDim, fontSize: 13, fontWeight: '600' },
  input: {
    height: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.elevated,
  },
  error: { color: colors.danger, fontSize: 14 },
  button: { height: 52, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  buttonPrimary: { backgroundColor: colors.white },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: colors.bg, fontSize: 16, fontWeight: '700' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingBottom: 60 },
  doneTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  doneBody: { color: colors.textDim, fontSize: 15, marginBottom: 16 },
});
