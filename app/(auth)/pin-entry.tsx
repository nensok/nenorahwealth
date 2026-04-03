import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PinPad } from '@/components/ui/pin-pad';
import { useColors } from '@/hooks/use-colors';
import { useAuthStore } from '@/stores/auth-store';
import { useAppStore } from '@/stores/app-store';

export default function PinEntryScreen() {
  const colors = useColors();
  const verifyPin = useAuthStore((s) => s.verifyPin);
  const removePin = useAuthStore((s) => s.removePin);
  const settings = useAppStore((s) => s.settings);
  const [isError, setIsError] = useState(false);

  async function handlePin(pin: string) {
    const ok = await verifyPin(pin);
    if (ok) {
      router.replace('/(tabs)');
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 800);
    }
  }

  function handleForgotPin() {
    Alert.alert(
      'Reset PIN',
      'Resetting your PIN will delete all your financial data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset & Delete Data',
          style: 'destructive',
          onPress: async () => {
            await removePin();
            router.replace('/(onboarding)/welcome');
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brand}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
            <MaterialIcons name="account-balance-wallet" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>NenorahWealth</Text>
          {settings?.userName ? (
            <Text style={[styles.welcomeBack, { color: colors.muted }]}>
              Welcome back, {settings.userName}
            </Text>
          ) : null}
        </View>

        <PinPad
          title="Enter your PIN"
          subtitle="Enter your 4-digit PIN to continue"
          onComplete={handlePin}
          isError={isError}
        />

        {isError && (
          <Text style={[styles.errorText, { color: colors.negative }]}>
            Incorrect PIN. Please try again.
          </Text>
        )}

        <Pressable onPress={handleForgotPin} style={styles.forgotBtn}>
          <Text style={[styles.forgotText, { color: colors.muted }]}>Forgot PIN?</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 40 },
  brand: { alignItems: 'center', gap: 12 },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  appName: { fontSize: 22, fontWeight: '800' },
  welcomeBack: { fontSize: 14 },
  errorText: { textAlign: 'center', fontSize: 14, marginTop: -20 },
  forgotBtn: { alignItems: 'center', paddingVertical: 12 },
  forgotText: { fontSize: 14, fontWeight: '500' },
});
