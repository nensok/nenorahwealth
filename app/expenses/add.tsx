import { useEffect } from 'react';
import { ScrollView, StyleSheet, Alert } from 'react-native';
import { router } from 'expo-router';
import { ExpenseForm } from '@/components/forms/expense-form';
import { useColors } from '@/hooks/use-colors';
import { useExpenseStore } from '@/stores/expense-store';
import { useCategoryStore } from '@/stores/category-store';
import { useBudgetStore } from '@/stores/budget-store';
import { parseCurrencyInput, formatCurrency } from '@/lib/utils/currency';
import { useAppStore } from '@/stores/app-store';
import type { ExpenseFormData } from '@/types';

export default function AddExpenseScreen() {
  const colors = useColors();
  const add = useExpenseStore((s) => s.add);
  const loadCategories = useCategoryStore((s) => s.load);
  const getById = useCategoryStore((s) => s.getById);
  const loadBudgets = useBudgetStore((s) => s.loadByMonth);
  const checkOverBudget = useBudgetStore((s) => s.checkOverBudget);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  useEffect(() => { loadCategories(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(data: ExpenseFormData) {
    const date = data.date;
    const [y, m] = date.split('-').map(Number);
    const month = m;
    const year = y;

    await add({
      amount: parseCurrencyInput(data.amount),
      categoryId: data.categoryId,
      description: data.description,
      date,
      month,
      year,
    });

    // Load budgets for this month and check if over
    await loadBudgets(month, year);
    const overInfo = await checkOverBudget(data.categoryId, month, year);
    if (overInfo?.isOver) {
      const cat = getById(data.categoryId);
      Alert.alert(
        '⚠️ Budget Exceeded',
        `You've spent ${formatCurrency(overInfo.spent, currency)} on ${cat?.name ?? 'this category'}, exceeding your ${formatCurrency(overInfo.budget, currency)} budget.`,
        [{ text: 'OK' }],
      );
    }

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
