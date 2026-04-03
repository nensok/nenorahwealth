import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PinPad } from '@/components/ui/pin-pad';
import { useColors } from '@/hooks/use-colors';
import { useAuthStore } from '@/stores/auth-store';

export default function PinSetupScreen() {
  const colors = useColors();
  const setupPin = useAuthStore((s) => s.setupPin);

  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [firstPin, setFirstPin] = useState('');
  const [isError, setIsError] = useState(false);

  function handleFirstPin(pin: string) {
    setFirstPin(pin);
    setStep('confirm');
    setIsError(false);
  }

  async function handleConfirmPin(pin: string) {
    if (pin !== firstPin) {
      setIsError(true);
      setTimeout(() => {
        setStep('create');
        setFirstPin('');
        setIsError(false);
      }, 600);
      return;
    }
    await setupPin(pin);
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Brand */}
        <View style={styles.brand}>
          <View style={[styles.logoWrap, { backgroundColor: colors.accent + '20', borderColor: colors.accent + '40' }]}>
            <MaterialIcons name="lock" size={32} color={colors.accent} />
          </View>
          <Text style={[styles.appName, { color: colors.text }]}>Secure Your App</Text>
          <Text style={[styles.brandSub, { color: colors.muted }]}>
            {step === 'create' ? 'Choose a 4-digit PIN' : 'Confirm your PIN'}
          </Text>
        </View>

        {step === 'create' ? (
          <PinPad
            title="Create Your PIN"
            subtitle="Choose a 4-digit PIN to secure your app"
            onComplete={handleFirstPin}
          />
        ) : (
          <PinPad
            title="Confirm Your PIN"
            subtitle="Enter the same PIN again"
            onComplete={handleConfirmPin}
            isError={isError}
          />
        )}
        {isError && (
          <Text style={[styles.errorText, { color: colors.negative }]}>
            PINs do not match. Try again.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32, gap: 32 },
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
  brandSub: { fontSize: 14 },
  errorText: { textAlign: 'center', fontSize: 14, marginTop: -16 },
});
