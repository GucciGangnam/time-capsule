import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/AuthProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

/**
 * Redirect based on auth state:
 *  - no session              → (auth) sign-in
 *  - session, no profile yet → onboarding (choose username)
 *  - session + profile       → the app (tabs)
 */
function useAuthGuard() {
  const { initializing, session, profile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (initializing) return;
    const root = segments[0];
    const inAuthGroup = root === '(auth)';
    const onOnboarding = root === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && !profile && !onOnboarding) {
      router.replace('/onboarding');
    } else if (session && profile && (inAuthGroup || onOnboarding)) {
      router.replace('/(tabs)');
    }
  }, [initializing, session, profile, segments, router]);
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { initializing } = useAuth();
  useAuthGuard();

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync();
  }, [initializing]);

  // Keep the native splash up until we know where to route.
  if (initializing) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
