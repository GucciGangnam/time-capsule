import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen, Button, FormError, TextField, authColors } from '@/features/auth/ui';
import { supabase } from '@/lib/supabase';

type Phase = 'form' | 'verify';

export default function SignUp() {
  const [phase, setPhase] = useState<Phase>('form');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function onSignUp() {
    setError(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail) return setError('Enter your email.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email: trimmedEmail, password });
    setLoading(false);
    if (error) return setError(error.message);
    // If email confirmation is disabled, a session is returned immediately and
    // the auth guard takes over. Otherwise, move to OTP entry.
    if (!data.session) setPhase('verify');
  }

  async function onVerify() {
    setError(null);
    if (code.trim().length < 6) return setError('Enter the 6-digit code from your email.');
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'signup',
    });
    setLoading(false);
    if (error) return setError(error.message);
    // On success the session is set and the auth guard routes to onboarding.
  }

  async function onResend() {
    setError(null);
    setNotice(null);
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) setError(error.message);
    else setNotice('A new code is on its way.');
  }

  if (phase === 'verify') {
    return (
      <AuthScreen
        title="Check your email"
        subtitle={`Enter the 6-digit code we sent to ${email.trim()}.`}>
        <TextField
          label="Confirmation code"
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          maxLength={6}
          placeholder="123456"
        />
        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
        <FormError message={error} />
        <Button label="Verify & continue" onPress={onVerify} loading={loading} />
        <Button label="Resend code" onPress={onResend} variant="ghost" />
        <Text
          style={[styles.link, styles.center]}
          onPress={() => {
            setPhase('form');
            setCode('');
            setError(null);
            setNotice(null);
          }}>
          Use a different email
        </Text>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Create account"
      subtitle="Join Time Capsule"
      footer={
        <View style={styles.row}>
          <Text style={styles.muted}>Already have an account? </Text>
          <Link href="/(auth)/sign-in" style={styles.link}>
            Sign in
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
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="At least 8 characters"
      />
      <TextField
        label="Confirm password"
        value={confirm}
        onChangeText={setConfirm}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        placeholder="Re-enter your password"
      />
      <FormError message={error} />
      <Button label="Create account" onPress={onSignUp} loading={loading} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  muted: { color: authColors.muted, fontSize: 15 },
  link: { color: authColors.text, fontSize: 15, fontWeight: '700' },
  center: { textAlign: 'center', marginTop: 4 },
  notice: { color: authColors.success, fontSize: 14, textAlign: 'center' },
});
