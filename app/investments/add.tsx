import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { InvestmentForm } from '@/components/forms/investment-form';
import { useColors } from '@/hooks/use-colors';
import { useInvestmentStore } from '@/stores/investment-store';
import { useAppStore } from '@/stores/app-store';
import type { InvestmentFormData } from '@/types';

export default function AddInvestmentScreen() {
  const colors = useColors();
  const add = useInvestmentStore((s) => s.add);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  async function handleSubmit(data: InvestmentFormData) {
    await add({
      stockName: data.stockName,
      ticker: data.ticker,
      quantity: parseFloat(data.quantity),
      buyPrice: parseFloat(data.buyPrice),
      currentPrice: parseFloat(data.currentPrice),
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
      <InvestmentForm onSubmit={handleSubmit} submitLabel="Add Position" currencySymbol={currency} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
});
