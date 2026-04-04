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
import { useAppStore } from '@/stores/app-store';
import { getCurrentMonthYear, getLast6Months } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import { getDb } from '@/lib/db/client';
import { getCategorySpendByMonths } from '@/lib/db/queries/expenses';
import type { Expense, CategoryTrendPoint } from '@/types';

export default function ExpensesScreen() {
  const colors = useColors();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<CategoryTrendPoint[]>([]);
  const [trendMonths, setTrendMonths] = useState<{ month: number; year: number }[]>([]);
  const [showTrends, setShowTrends] = useState(false);

  const settings = useAppStore((s) => s.settings);
  const currency = settings?.currencySymbol ?? '₦';
  const records = useExpenseStore((s) => s.records);
  const loadByMonth = useExpenseStore((s) => s.loadByMonth);
  const getMonthlyTotal = useExpenseStore((s) => s.getMonthlyTotal);
  const getById = useCategoryStore((s) => s.getById);
  const categories = useCategoryStore((s) => s.categories);

  useEffect(() => {
    loadByMonth(month, year);
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
            style={[styles.headerBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
          >
            <MaterialIcons name="account-balance" size={16} color={colors.accent} />
            <Text style={[styles.headerBtnText, { color: colors.accent }]}>Budgets</Text>
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
          <View style={styles.header}>
            {/* Summary */}
            <FadeInView delay={0}>
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Expenses</Text>
                  <Text style={[styles.summaryAmount, { color: colors.negative }]}>
                    {formatCurrency(getMonthlyTotal(), currency)}
                  </Text>
                </View>
                <View style={styles.summaryRight}>
                  <View style={[styles.summaryIcon, { backgroundColor: colors.negative + '20' }]}>
                    <MaterialIcons name="arrow-upward" size={22} color={colors.negative} />
                  </View>
                  <Pressable
                    onPress={() => setShowTrends((v) => !v)}
                    style={[styles.trendsBtn, { borderColor: showTrends ? colors.accent : colors.border, backgroundColor: showTrends ? colors.accent + '15' : colors.surfaceElevated }]}
                  >
                    <MaterialIcons name="insights" size={14} color={showTrends ? colors.accent : colors.muted} />
                    <Text style={[styles.trendsBtnText, { color: showTrends ? colors.accent : colors.muted }]}>Trends</Text>
                  </Pressable>
                </View>
              </View>
            </FadeInView>

            {/* Inline trends (toggle) */}
            {showTrends && trendData.length > 0 && (
              <FadeInView delay={0}>
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
            )}

            {/* Month picker */}
            <FadeInView delay={60}>
              <View style={styles.pickerRow}>
                <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
              </View>
            </FadeInView>

            {/* Search */}
            <FadeInView delay={90}>
              <View style={styles.searchRow}>
                <SearchBar value={search} onChangeText={setSearch} placeholder="Search expenses…" />
              </View>
            </FadeInView>

            {/* Category filter chips */}
            {categories.length > 0 && (
              <FadeInView delay={120}>
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
  header: { gap: 0 },
  headerBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  headerBtnText: { fontSize: 12, fontWeight: '600' },
  summaryCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    margin: 16, padding: 20, borderRadius: 20, borderWidth: 1,
  },
  summaryLabel: { fontSize: 13, fontWeight: '500' },
  summaryAmount: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  summaryRight: { alignItems: 'flex-end', gap: 8 },
  summaryIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  trendsBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  trendsBtnText: { fontSize: 11, fontWeight: '600' },
  trendCard: { marginHorizontal: 16, marginBottom: 8 },
  trendTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  trendSub: { fontSize: 12, marginBottom: 16 },
  pickerRow: { paddingHorizontal: 16, marginBottom: 8 },
  searchRow: { paddingHorizontal: 16, marginBottom: 8 },
  chips: { paddingHorizontal: 16, paddingBottom: 10, gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 12, fontWeight: '600' },
  listContent: { paddingVertical: 4, paddingBottom: 80 },
  emptyContainer: { flexGrow: 1 },
  noResults: { padding: 32, alignItems: 'center' },
  noResultsText: { fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 24, width: 56, height: 56,
    borderRadius: 28, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: '#FF4D4D', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8,
  },
});
