import { useEffect, useRef } from 'react';
import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useAppStore } from '@/stores/app-store';
import { useAuthStore } from '@/stores/auth-store';
import { useRecurringStore } from '@/stores/recurring-store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({});

  const initializeDb = useAppStore((s) => s.initializeDb);
  const loadSettings = useAppStore((s) => s.loadSettings);
  const settings = useAppStore((s) => s.settings);
  const isDbReady = useAppStore((s) => s.isDbReady);

  const checkPinExists = useAuthStore((s) => s.checkPinExists);
  const isPinSet = useAuthStore((s) => s.isPinSet);
  const processRecurring = useRecurringStore((s) => s.processDue);

  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    async function init() {
      await initializeDb();
      await loadSettings();
      await checkPinExists();
      // Auto-generate any overdue recurring transactions
      await processRecurring();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isDbReady || !fontsLoaded) return;
    if (settings === null) return;

    SplashScreen.hideAsync();

    if (!settings.onboardingDone) {
      router.replace('/(onboarding)/welcome');
    } else if (!isPinSet) {
      router.replace('/(auth)/pin-setup');
    } else {
      router.replace('/(auth)/pin-entry');
    }
  }, [isDbReady, fontsLoaded, settings, isPinSet]);

  return (
    <ThemeProvider value={DarkTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="income" />
        <Stack.Screen name="expenses" />
        <Stack.Screen name="investments" />
        <Stack.Screen name="categories" />
        <Stack.Screen name="budgets" />
        <Stack.Screen name="recurring" />
        <Stack.Screen name="export" options={{ headerShown: true, title: 'Export Report', presentation: 'modal' }} />
        <Stack.Screen name="backup" options={{ headerShown: true, title: 'Backup & Restore', presentation: 'modal' }} />
      </Stack>
      <StatusBar style="light" backgroundColor="#0A0A0A" />
    </ThemeProvider>
  );
}
