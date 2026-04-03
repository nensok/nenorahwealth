import { useEffect, useState } from 'react';
import { ScrollView, View, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { InvestmentForm } from '@/components/forms/investment-form';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { useInvestmentStore } from '@/stores/investment-store';
import { useAppStore } from '@/stores/app-store';
import { getDb } from '@/lib/db/client';
import { getInvestmentById } from '@/lib/db/queries/investments';
import type { Investment, InvestmentFormData } from '@/types';

export default function EditInvestmentScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<Investment | null>(null);

  const update = useInvestmentStore((s) => s.update);
  const remove = useInvestmentStore((s) => s.remove);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  useEffect(() => {
    async function load() {
      const db = await getDb();
      const item = await getInvestmentById(db, parseInt(id));
      setRecord(item);
    }
    load();
  }, [id]);

  async function handleSubmit(data: InvestmentFormData) {
    await update(parseInt(id), {
      stockName: data.stockName,
      ticker: data.ticker,
      quantity: parseFloat(data.quantity),
      buyPrice: parseFloat(data.buyPrice),
      currentPrice: parseFloat(data.currentPrice),
      notes: data.notes,
    });
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Position', 'Remove this investment position?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(parseInt(id));
          router.back();
        },
      },
    ]);
  }

  if (!record) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <InvestmentForm
        defaultValues={{
          stockName: record.stockName,
          ticker: record.ticker,
          quantity: String(record.quantity),
          buyPrice: String(record.buyPrice),
          currentPrice: String(record.currentPrice),
          notes: record.notes,
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
        currencySymbol={currency}
      />
      <Button label="Delete Position" variant="danger" onPress={handleDelete} style={styles.deleteBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { marginTop: 8 },
});
