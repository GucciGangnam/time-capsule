import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Surface } from '@/components/Surface';
import { useAuth } from '@/features/auth/AuthProvider';
import { colors } from '@/lib/theme';

export function SettingsPane({ active: _active }: { active: boolean }) {
  const insets = useSafeAreaInsets();
  const { session, profile, signOut } = useAuth();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 120, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>Settings</Text>

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <Surface style={styles.card}>
        <InfoRow label="Username" value={profile ? `@${profile.username}` : '—'} />
        <Divider />
        <InfoRow label="Email" value={session?.user?.email ?? '—'} />
      </Surface>

      <Text style={styles.sectionLabel}>SECURITY</Text>
      <Surface style={styles.card}>
        <ActionRow label="Change password" onPress={() => router.push('/(app)/change-password')} />
      </Surface>

      <Surface style={styles.card}>
        <ActionRow label="Sign out" destructive onPress={() => signOut()} />
      </Surface>

      <Text style={styles.version}>
        Time Capsule {Constants.expoConfig?.version ?? '1.0.0'}
      </Text>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function ActionRow({
  label,
  onPress,
  destructive,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <Text style={[styles.actionLabel, destructive && styles.destructive]}>{label}</Text>
      {!destructive ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: { color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  sectionLabel: {
    color: colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: { paddingHorizontal: 16 },
  row: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  pressed: { opacity: 0.55 },
  rowLabel: { color: colors.textDim, fontSize: 15 },
  rowValue: { color: colors.text, fontSize: 15, fontWeight: '600', maxWidth: '65%' },
  actionLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  destructive: { color: colors.danger },
  chevron: { color: colors.textFaint, fontSize: 22, fontWeight: '300' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  version: { color: colors.textFaint, fontSize: 13, textAlign: 'center', marginTop: 32 },
});
