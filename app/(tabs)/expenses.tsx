import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Pressable, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/ui/fade-in-view';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MonthPicker } from '@/components/ui/month-picker';
import { ListItem } from '@/components/ui/list-item';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SearchBar } from '@/components/ui/search-bar';
import { Card } from '@/components/ui/card';
import { CategoryTrend } from '@/components/charts/category-trend';
import { useColors } from '@/hooks/use-colors';
import { useExpenseStore } from '@/stores/expense-store';
import { useCategoryStore } from '@/stores/category-store';
import { useBudgetStore } from '@/stores/budget-store';
import { useAppStore } from '@/stores/app-store';
import { getCurrentMonthYear, getLast6Months } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { getDb } from '@/lib/db/client';
import { getCategorySpentForMonth } from '@/lib/db/queries/budgets';
import { getCategorySpendByMonths } from '@/lib/db/queries/expenses';
import type { Expense, Budget, CategoryTrendPoint } from '@/types';

export default function ExpensesScreen() {
  const colors = useColors();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<CategoryTrendPoint[]>([]);
  const [trendMonths, setTrendMonths] = useState<{ month: number; year: number }[]>([]);
  const [budgetsWithSpend, setBudgetsWithSpend] = useState<(Budget & { spent: number; percentage: number })[]>([]);

  const settings = useAppStore((s) => s.settings);
  const currency = settings?.currencySymbol ?? '₦';
  const records = useExpenseStore((s) => s.records);
  const loadByMonth = useExpenseStore((s) => s.loadByMonth);
  const getMonthlyTotal = useExpenseStore((s) => s.getMonthlyTotal);
  const getById = useCategoryStore((s) => s.getById);
  const categories = useCategoryStore((s) => s.categories);
  const budgets = useBudgetStore((s) => s.budgets);
  const loadBudgets = useBudgetStore((s) => s.loadByMonth);

  useEffect(() => {
    loadByMonth(month, year);
    loadBudgets(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  useEffect(() => {
    async function loadTrend() {
      const months = getLast6Months(month, year);
      setTrendMonths(months);
      const db = await getDb();
      const pts = await getCategorySpendByMonths(db, months);
      setTrendData(pts);
    }
    loadTrend();
  }, [month, year]);  

  useEffect(() => {
    async function enrichBudgets() {
      const db = await getDb();
      const enriched = await Promise.all(
        budgets.map(async (b) => {
          const spent = await getCategorySpentForMonth(db, b.categoryId, b.month, b.year);
          const percentage = b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0;
          return { ...b, spent, percentage };
        }),
      );
      setBudgetsWithSpend(enriched);
    }
    enrichBudgets();
  }, [budgets]);

  // Filtered records
  const filtered = records.filter((r) => {
    const matchSearch = search.length === 0 || r.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === null || r.categoryId === selectedCat;
    return matchSearch && matchCat;
  });

  function renderItem({ item, index }: { item: Expense; index: number }) {
    const category = getById(item.categoryId);
    return (
      <ListItem
        title={item.description || category?.name || 'Expense'}
        subtitle={category?.name}
        amount={item.amount}
        amountColor={colors.negative}
        currencySymbol={currency}
        accentColor={category?.color}
        rightLabel={item.date}
        onPress={() => router.push(`/expenses/${item.id}`)}
        index={index}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Expenses"
        subtitle="Monitor your spending"
        accentColor={colors.negative}
        right={
          <Pressable
            onPress={() => router.push('/budgets')}
            style={[styles.budgetBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <MaterialIcons name="account-balance" size={16} color={colors.accent} />
            <Text style={[styles.budgetBtnText, { color: colors.accent }]}>Budgets</Text>
          </Pressable>
        }
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={
          <View>
            {/* Summary */}
            <FadeInView delay={0}>
              <View style={[styles.summaryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Expenses</Text>
                  <Text style={[styles.summaryAmount, { color: colors.negative }]}>
                    {formatCurrency(getMonthlyTotal(), currency)}
                  </Text>
                </View>
                <View style={[styles.summaryIcon, { backgroundColor: colors.negative + '20' }]}>
                  <MaterialIcons name="arrow-upward" size={24} color={colors.negative} />
                </View>
              </View>
            </FadeInView>

            {/* Budget progress bars */}
            {budgetsWithSpend.length > 0 && (
              <FadeInView delay={60}>
                <View style={styles.budgetSection}>
                  {budgetsWithSpend.map((b) => {
                    const cat = getById(b.categoryId);
                    const isOver = b.spent > b.amount;
                    return (
                      <View key={b.id} style={[styles.budgetRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={styles.budgetTop}>
                          <View style={[styles.budgetDot, { backgroundColor: cat?.color ?? colors.accent }]} />
                          <Text style={[styles.budgetCat, { color: colors.text }]}>{cat?.name ?? '?'}</Text>
                          <Text style={[styles.budgetAmt, { color: isOver ? colors.negative : colors.muted }]}>
                            {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency)}
                          </Text>
                        </View>
                        <View style={[styles.trackBg, { backgroundColor: colors.surfaceElevated }]}>
                          <View style={[styles.trackFill, { width: `${b.percentage}%`, backgroundColor: isOver ? colors.negative : (cat?.color ?? colors.accent) }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </FadeInView>
            )}

            {/* Month picker */}
            <FadeInView delay={120}>
              <View style={styles.pickerRow}>
                <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
              </View>
            </FadeInView>

            {/* Search bar */}
            <FadeInView delay={150}>
              <View style={styles.searchRow}>
                <SearchBar value={search} onChangeText={setSearch} placeholder="Search expenses…" />
              </View>
            </FadeInView>

            {/* Category filter chips */}
            {categories.length > 0 && (
              <FadeInView delay={180}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                  <Pressable
                    onPress={() => setSelectedCat(null)}
                    style={[styles.chip, { borderColor: selectedCat === null ? colors.accent : colors.border, backgroundColor: selectedCat === null ? colors.accent + '15' : colors.surfaceElevated }]}
                  >
                    <Text style={[styles.chipText, { color: selectedCat === null ? colors.accent : colors.muted }]}>All</Text>
                  </Pressable>
                  {categories.map((cat) => {
                    const active = selectedCat === cat.id;
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setSelectedCat(active ? null : cat.id)}
                        style={[styles.chip, { borderColor: active ? cat.color : colors.border, backgroundColor: active ? cat.color + '20' : colors.surfaceElevated }]}
                      >
                        <View style={[styles.chipDot, { backgroundColor: cat.color }]} />
                        <Text style={[styles.chipText, { color: active ? cat.color : colors.muted }]}>{cat.name}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </FadeInView>
            )}
          </View>
        }
        ListEmptyComponent={
          search || selectedCat ? (
            <View style={styles.noResults}>
              <Text style={[styles.noResultsText, { color: colors.muted }]}>No results found</Text>
            </View>
          ) : (
            <EmptyState icon="receipt-long" title="No expenses this month" body="Tap the + button to record an expense." />
          )
        }
        ListFooterComponent={
          trendData.length > 0 ? (
            <FadeInView delay={200}>
              <Card style={styles.trendCard}>
                <Text style={[styles.trendTitle, { color: colors.text }]}>Category Trends</Text>
                <Text style={[styles.trendSub, { color: colors.muted }]}>6-month spending by category</Text>
                <CategoryTrend
                  data={trendData}
                  categories={categories}
                  months={trendMonths}
                  currencySymbol={currency}
                />
              </Card>
            </FadeInView>
          ) : null
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.negative }]}
        onPress={() => router.push('/expenses/add')}
      >
        <MaterialIcons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  summaryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    margin: 16, padding: 20, borderRadius: 20, borderWidth: 1,
  },
  summaryLabel: { fontSize: 13, fontWeight: '500' },
  summaryAmount: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  summaryIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  budgetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  budgetBtnText: { fontSize: 12, fontWeight: '600' },
  budgetSection: { paddingHorizontal: 16, gap: 8, marginBottom: 4 },
  budgetRow: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  budgetDot: { width: 8, height: 8, borderRadius: 4 },
  budgetCat: { flex: 1, fontSize: 13, fontWeight: '600' },
  budgetAmt: { fontSize: 11, fontWeight: '500' },
  trackBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  pickerRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  chips: { paddingHorizontal: 16, paddingBottom: 8, gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '600' },
  listContent: { paddingVertical: 4, paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  noResults: { padding: 32, alignItems: 'center' },
  noResultsText: { fontSize: 15 },
  trendCard: { margin: 16, marginTop: 8 },
  trendTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  trendSub: { fontSize: 12, marginBottom: 16 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});
