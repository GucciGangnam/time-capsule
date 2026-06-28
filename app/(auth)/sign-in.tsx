import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthScreen, Button, FormError, TextField, authColors } from '@/features/auth/ui';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) setError(error.message);
    // On success the auth guard redirects.
  }

  return (
    <AuthScreen
      title="Welcome back"
      subtitle="Sign in to Time Capsule"
      footer={
        <View style={styles.row}>
          <Text style={styles.muted}>New here? </Text>
          <Link href="/(auth)/sign-up" style={styles.link}>
            Create account
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
        autoComplete="current-password"
        textContentType="password"
        placeholder="Your password"
      />
      <FormError message={error} />
      <Button label="Sign in" onPress={onSubmit} loading={loading} />
      <Link href="/(auth)/forgot-password" style={[styles.link, styles.center]}>
        Forgot password?
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  muted: { color: authColors.muted, fontSize: 15 },
  link: { color: authColors.text, fontSize: 15, fontWeight: '700' },
  center: { textAlign: 'center' },
});
