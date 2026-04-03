import { useEffect, useState } from 'react';
import { ScrollView, View, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ExpenseForm } from '@/components/forms/expense-form';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { useExpenseStore } from '@/stores/expense-store';
import { useCategoryStore } from '@/stores/category-store';
import { getDb } from '@/lib/db/client';
import { getExpenseById } from '@/lib/db/queries/expenses';
import { parseCurrencyInput } from '@/lib/utils/currency';
import type { Expense, ExpenseFormData } from '@/types';

export default function EditExpenseScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<Expense | null>(null);

  const update = useExpenseStore((s) => s.update);
  const remove = useExpenseStore((s) => s.remove);
  const loadCategories = useCategoryStore((s) => s.load);

  useEffect(() => {
    loadCategories();
    async function load() {
      const db = await getDb();
      const item = await getExpenseById(db, parseInt(id));
      setRecord(item);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSubmit(data: ExpenseFormData) {
    const d = new Date(data.date);
    await update(parseInt(id), {
      amount: parseCurrencyInput(data.amount),
      categoryId: data.categoryId,
      description: data.description,
      date: data.date,
      month: d.getMonth() + 1,
      year: d.getFullYear(),
    });
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Expense', 'Are you sure?', [
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
      <ExpenseForm
        defaultValues={{
          amount: String(record.amount),
          categoryId: record.categoryId,
          description: record.description,
          date: record.date,
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
