import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth, type Profile } from '@/features/auth/AuthProvider';
import { AuthScreen, Button, FormError, TextField, authColors } from '@/features/auth/ui';
import { isUsernameAvailable, validateUsername } from '@/features/auth/username';
import { supabase } from '@/lib/supabase';

export default function Onboarding() {
  const { session, profile, setLocalProfile, signOut } = useAuth();
  const [username, setUsername] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validation = validateUsername(username);

  // Debounced live availability check.
  useEffect(() => {
    setAvailable(null);
    if (validateUsername(username)) return;
    let active = true;
    setChecking(true);
    const handle = setTimeout(() => {
      isUsernameAvailable(username)
        .then((free) => {
          if (active) setAvailable(free);
        })
        .catch(() => {
          if (active) setAvailable(null);
        })
        .finally(() => {
          if (active) setChecking(false);
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [username]);

  async function onClaim() {
    setError(null);
    const invalid = validateUsername(username);
    if (invalid) return setError(invalid);
    if (!session) return;

    setSubmitting(true);
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: session.user.id, username: username.trim() })
      .select('id, username, created_at')
      .single();
    setSubmitting(false);

    if (error) {
      // 23505 = unique_violation (lost the race / case-insensitive clash).
      if (error.code === '23505') return setError('That username is already taken.');
      return setError(error.message);
    }
    setLocalProfile(data as Profile); // auth guard routes to the app
  }

  const canSubmit = !validation && available === true && !checking && !submitting;

  return (
    <AuthScreen
      title="Choose your username"
      subtitle="This is permanent — you can't change it later."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.muted}>Signed in as {session?.user?.email}</Text>
          <Text style={styles.link} onPress={() => signOut()}>
            Sign out
          </Text>
        </View>
      }>
      <TextField
        label="Username"
        value={username}
        onChangeText={(t) => setUsername(t.replace(/\s/g, ''))}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
        maxLength={12}
        placeholder="3–12 letters, numbers, _"
        error={username.length > 0 ? validation : null}
        hint={<UsernameStatus username={username} validation={validation} checking={checking} available={available} />}
      />
      <FormError message={error} />
      <Button
        label={profile ? 'Continue' : 'Claim username'}
        onPress={onClaim}
        loading={submitting}
        disabled={!canSubmit}
      />
    </AuthScreen>
  );
}

function UsernameStatus({
  username,
  validation,
  checking,
  available,
}: {
  username: string;
  validation: string | null;
  checking: boolean;
  available: boolean | null;
}) {
  if (!username || validation) return null;
  if (checking) return <Text style={styles.muted}>Checking availability…</Text>;
  if (available === true) return <Text style={styles.ok}>✓ @{username.trim()} is available</Text>;
  if (available === false) return <Text style={styles.bad}>@{username.trim()} is taken</Text>;
  return null;
}

const styles = StyleSheet.create({
  footerRow: { gap: 6, alignItems: 'center' },
  muted: { color: authColors.muted, fontSize: 14 },
  link: { color: authColors.text, fontSize: 15, fontWeight: '700' },
  ok: { color: authColors.success, fontSize: 13 },
  bad: { color: authColors.danger, fontSize: 13 },
});
