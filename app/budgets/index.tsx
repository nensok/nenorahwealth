import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useColors } from '@/hooks/use-colors';
import { useBudgetStore } from '@/stores/budget-store';
import { useCategoryStore } from '@/stores/category-store';
import { useAppStore } from '@/stores/app-store';
import { getCurrentMonthYear } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { getDb } from '@/lib/db/client';
import { getCategorySpentForMonth } from '@/lib/db/queries/budgets';
import type { BudgetWithSpend, Category } from '@/types';

export default function BudgetsScreen() {
  const colors = useColors();
  const { month, year } = getCurrentMonthYear();
  const budgets = useBudgetStore((s) => s.budgets);
  const loadByMonth = useBudgetStore((s) => s.loadByMonth);
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.load);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');
  const [budgetsWithSpend, setBudgetsWithSpend] = useState<BudgetWithSpend[]>([]);

  useEffect(() => {
    loadCategories();
    loadByMonth(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function enrich() {
      const db = await getDb();
      const enriched = await Promise.all(
        budgets.map(async (b) => {
          const spent = await getCategorySpentForMonth(db, b.categoryId, b.month, b.year);
          const remaining = b.amount - spent;
          const percentage = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
          return { ...b, spent, remaining, percentage };
        }),
      );
      setBudgetsWithSpend(enriched);
    }
    enrich();
  }, [budgets]);

  // Categories without a budget — show as "add" rows
  const setCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgeted = categories.filter((c) => !setCategoryIds.has(c.id));

  function renderBudget({ item }: { item: BudgetWithSpend }) {
    const cat = categories.find((c) => c.id === item.categoryId);
    const isOver = item.spent > item.amount;
    return (
      <Pressable
        onPress={() => router.push(`/budgets/${item.categoryId}`)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={styles.cardTop}>
          <View style={[styles.dot, { backgroundColor: cat?.color ?? colors.accent }]} />
          <Text style={[styles.catName, { color: colors.text }]}>{cat?.name ?? 'Unknown'}</Text>
          <Text style={[styles.amounts, { color: isOver ? colors.negative : colors.muted }]}>
            {formatCurrency(item.spent, currency)} / {formatCurrency(item.amount, currency)}
          </Text>
        </View>
        <View style={[styles.trackBg, { backgroundColor: colors.surfaceElevated }]}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${item.percentage}%`,
                backgroundColor: isOver ? colors.negative : cat?.color ?? colors.accent,
              },
            ]}
          />
        </View>
        {isOver && (
          <Text style={[styles.overText, { color: colors.negative }]}>
            Over by {formatCurrency(item.spent - item.amount, currency)}
          </Text>
        )}
      </Pressable>
    );
  }

  function renderUnbudgeted({ item }: { item: Category }) {
    return (
      <Pressable
        onPress={() => router.push(`/budgets/${item.id}`)}
        style={[styles.card, styles.unbudgetedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.dot, { backgroundColor: item.color }]} />
        <Text style={[styles.catName, { color: colors.muted }]}>{item.name}</Text>
        <MaterialIcons name="add" size={18} color={colors.muted} />
      </Pressable>
    );
  }

  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Budgets" subtitle={monthLabel} />
      <FlatList
        data={budgetsWithSpend}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderBudget}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          budgetsWithSpend.length === 0 ? (
            <EmptyState icon="account-balance" title="No budgets set" body="Tap a category below to set a monthly budget." />
          ) : null
        }
        ListFooterComponent={
          unbudgeted.length > 0 ? (
            <View>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>SET BUDGET FOR</Text>
              {unbudgeted.map((cat) => (
                <View key={cat.id}>{renderUnbudgeted({ item: cat })}</View>
              ))}
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 40 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, marginTop: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10 },
  unbudgetedCard: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  catName: { flex: 1, fontSize: 15, fontWeight: '600' },
  amounts: { fontSize: 13, fontWeight: '500' },
  trackBg: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4 },
  overText: { fontSize: 12, fontWeight: '600' },
});
