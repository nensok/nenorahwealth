import { useEffect, useState } from 'react';
import { ScrollView, View, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { IncomeForm } from '@/components/forms/income-form';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { useIncomeStore } from '@/stores/income-store';
import { getDb } from '@/lib/db/client';
import { getIncomeById } from '@/lib/db/queries/income';
import { parseCurrencyInput } from '@/lib/utils/currency';
import type { Income, IncomeFormData } from '@/types';

export default function EditIncomeScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<Income | null>(null);

  const update = useIncomeStore((s) => s.update);
  const remove = useIncomeStore((s) => s.remove);

  useEffect(() => {
    async function load() {
      const db = await getDb();
      const item = await getIncomeById(db, parseInt(id));
      setRecord(item);
    }
    load();
  }, [id]);

  async function handleSubmit(data: IncomeFormData) {
    await update(parseInt(id), {
      amount: parseCurrencyInput(data.amount),
      source: data.source,
      month: data.month,
      year: data.year,
      notes: data.notes,
    });
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Income', 'Are you sure you want to delete this record?', [
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
      <IncomeForm
        defaultValues={{
          amount: String(record.amount),
          source: record.source,
          month: record.month,
          year: record.year,
          notes: record.notes,
        }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
      <Button label="Delete" variant="danger" onPress={handleDelete} style={styles.deleteBtn} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { marginTop: 8 },
});
