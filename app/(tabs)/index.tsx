import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  const [status, setStatus] = useState('checking…');

  useEffect(() => {
    // P0 smoke test: confirm the Supabase client initialized and env vars loaded.
    supabase.auth
      .getSession()
      .then(({ error }) => setStatus(error ? `error: ${error.message}` : 'client ready ✓'))
      .catch((e) => setStatus(`error: ${String(e)}`));
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Time Capsule</Text>
      <Text style={styles.subtitle}>Pin moments to places.</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeLabel}>SUPABASE</Text>
        <Text style={styles.badgeValue}>{status}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.6,
  },
  badge: {
    marginTop: 24,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: 'rgba(127,127,127,0.12)',
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    opacity: 0.5,
  },
  badgeValue: {
    fontSize: 15,
    fontWeight: '600',
  },
});
