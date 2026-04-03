import { useEffect } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ExpenseForm } from '@/components/forms/expense-form';
import { useColors } from '@/hooks/use-colors';
import { useExpenseStore } from '@/stores/expense-store';
import { useCategoryStore } from '@/stores/category-store';
import { parseCurrencyInput } from '@/lib/utils/currency';
import type { ExpenseFormData } from '@/types';

export default function AddExpenseScreen() {
  const colors = useColors();
  const add = useExpenseStore((s) => s.add);
  const loadCategories = useCategoryStore((s) => s.load);

  useEffect(() => { loadCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(data: ExpenseFormData) {
    const date = data.date;
    const d = new Date(date);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();

    await add({
      amount: parseCurrencyInput(data.amount),
      categoryId: data.categoryId,
      description: data.description,
      date,
      month,
      year,
    });
    router.back();
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <ExpenseForm onSubmit={handleSubmit} submitLabel="Add Expense" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40 },
});
