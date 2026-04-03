import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { useAppStore } from '@/stores/app-store';
import { useIncomeStore } from '@/stores/income-store';
import { getCurrentMonthYear } from '@/lib/utils/date';
import { parseCurrencyInput } from '@/lib/utils/currency';

export default function InitialIncomeScreen() {
  const colors = useColors();
  const { name, currency } = useLocalSearchParams<{ name: string; currency: string }>();

  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const addIncome = useIncomeStore((s) => s.add);

  const [income, setIncome] = useState('');
  const [source, setSource] = useState('Salary');
  const [loading, setLoading] = useState(false);

  const { month, year } = getCurrentMonthYear();

  async function handleFinish() {
    setLoading(true);
    await completeOnboarding(name ?? '', currency ?? '₦');

    const amount = parseCurrencyInput(income);
    if (amount > 0) {
      await addIncome({ amount, source, month, year });
    }

    setLoading(false);
    router.replace('/(auth)/pin-setup');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Hello, {name}!</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>
            What is your income this month? (You can skip this and add it later.)
          </Text>
        </View>

        <View style={styles.fields}>
          <Input
            label={`Monthly Income (${currency ?? '₦'})`}
            placeholder="0"
            keyboardType="decimal-pad"
            value={income}
            onChangeText={setIncome}
          />
          <Input
            label="Income Source"
            placeholder="e.g. Salary, Business"
            value={source}
            onChangeText={setSource}
          />
        </View>

        <View style={styles.actions}>
          <Button label="Finish & Set PIN" onPress={handleFinish} loading={loading} />
          <Button
            label="Skip for now"
            variant="ghost"
            onPress={async () => {
              setLoading(true);
              await completeOnboarding(name ?? '', currency ?? '₦');
              setLoading(false);
              router.replace('/(auth)/pin-setup');
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: 24, gap: 32, justifyContent: 'center' },
  header: { gap: 12 },
  title: { fontSize: 26, fontWeight: '700' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  fields: { gap: 16 },
  actions: { gap: 12 },
});
