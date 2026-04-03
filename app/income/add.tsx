import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { IncomeForm } from '@/components/forms/income-form';
import { useColors } from '@/hooks/use-colors';
import { useIncomeStore } from '@/stores/income-store';
import { parseCurrencyInput } from '@/lib/utils/currency';
import type { IncomeFormData } from '@/types';

export default function AddIncomeScreen() {
  const colors = useColors();
  const add = useIncomeStore((s) => s.add);

  async function handleSubmit(data: IncomeFormData) {
    await add({
      amount: parseCurrencyInput(data.amount),
      source: data.source,
      month: data.month,
      year: data.year,
      notes: data.notes,
    });
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <IncomeForm onSubmit={handleSubmit} submitLabel="Add Income" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
});
