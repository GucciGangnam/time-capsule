import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/features/auth/AuthProvider';
import { Button } from '@/features/auth/ui';

export default function HomeScreen() {
  const { session, profile, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Time Capsule</Text>
        <Text style={styles.subtitle}>Pin moments to places.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>SIGNED IN AS</Text>
          <Text style={styles.username}>@{profile?.username}</Text>
          <Text style={styles.email}>{session?.user?.email}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Button label="Sign out" onPress={() => signOut()} variant="ghost" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 16, opacity: 0.6 },
  card: {
    marginTop: 28,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(127,127,127,0.12)',
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, opacity: 0.5 },
  username: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 14, opacity: 0.6 },
  actions: { paddingBottom: 8 },
});
