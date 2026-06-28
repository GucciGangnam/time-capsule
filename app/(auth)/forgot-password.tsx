import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen, Button, FormError, TextField, authColors } from '@/features/auth/ui';
import { supabase } from '@/lib/supabase';

type Phase = 'request' | 'reset';

export default function ForgotPassword() {
  const [phase, setPhase] = useState<Phase>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onRequest() {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError('Enter your email.');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
    setLoading(false);
    // Always advance — don't reveal whether an account exists for this email.
    if (error) return setError(error.message);
    setPhase('reset');
  }

  async function onReset() {
    setError(null);
    if (code.trim().length < 6) return setError('Enter the 6-digit code from your email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    });
    if (verifyError) {
      setLoading(false);
      return setError(verifyError.message);
    }
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) return setError(updateError.message);
    // Recovery established a session; the auth guard routes onward.
  }

  if (phase === 'reset') {
    return (
      <AuthScreen
        title="Set a new password"
        subtitle={`Enter the 6-digit code we sent to ${email.trim()} and choose a new password.`}>
        <TextField
          label="Recovery code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          placeholder="123456"
        />
        <TextField
          label="New password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="At least 8 characters"
        />
        <FormError message={error} />
        <Button label="Update password" onPress={onReset} loading={loading} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Reset password"
      subtitle="We'll email you a 6-digit code to reset it."
      footer={
        <View style={styles.row}>
          <Link href="/(auth)/sign-in" style={styles.link}>
            Back to sign in
          </Link>
        </View>
      }>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        autoComplete="email"
        textContentType="emailAddress"
        placeholder="you@example.com"
      />
      <FormError message={error} />
      <Button label="Send code" onPress={onRequest} loading={loading} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  link: { color: authColors.text, fontSize: 15, fontWeight: '700' },
});
