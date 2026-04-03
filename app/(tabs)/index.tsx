import { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { FadeInView } from '@/components/ui/fade-in-view';
import { useAnimatedNumber } from '@/hooks/use-animated-number';
import { MonthPicker } from '@/components/ui/month-picker';
import { Card } from '@/components/ui/card';
import { SpendingPie } from '@/components/charts/spending-pie';
import { MonthlyTrendLine } from '@/components/charts/monthly-trend-line';
import { useColors } from '@/hooks/use-colors';
import { useIncomeStore } from '@/stores/income-store';
import { useExpenseStore } from '@/stores/expense-store';
import { useCategoryStore } from '@/stores/category-store';
import { useAppStore } from '@/stores/app-store';
import { getCurrentMonthYear, getLast6Months } from '@/lib/utils/date';
import { calcBalance, calcCategorySpend } from '@/lib/utils/calculations';
import { formatCurrency } from '@/lib/utils/currency';
import type { MonthlySummary } from '@/types';

export default function DashboardScreen() {
  const colors = useColors();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [trendData, setTrendData] = useState<MonthlySummary[]>([]);

  const settings = useAppStore((s) => s.settings);
  const currency = settings?.currencySymbol ?? '₦';

  const loadIncome = useIncomeStore((s) => s.loadByMonth);
  const loadExpenses = useExpenseStore((s) => s.loadByMonth);
  const loadCategories = useCategoryStore((s) => s.load);
  const fetchIncomeTotals = useIncomeStore((s) => s.fetchMonthlyTotals);
  const fetchExpenseTotals = useExpenseStore((s) => s.fetchMonthlyTotals);
  const incomeRecords = useIncomeStore((s) => s.records);
  const expenseRecords = useExpenseStore((s) => s.records);
  const categories = useCategoryStore((s) => s.categories);

  const totalIncome = incomeRecords.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((s, r) => s + r.amount, 0);
  const balance = calcBalance(totalIncome, totalExpenses);
  const categorySpend = calcCategorySpend(expenseRecords, categories);

  // Animated counters for the debit card
  const animBalance = useAnimatedNumber(balance, 1100);
  const animIncome = useAnimatedNumber(totalIncome, 950);
  const animExpenses = useAnimatedNumber(totalExpenses, 950);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadIncome(month, year);
    loadExpenses(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  useEffect(() => {
    async function loadTrend() {
      const months = getLast6Months(month, year);
      const [incomeTotals, expenseTotals] = await Promise.all([
        fetchIncomeTotals(months),
        fetchExpenseTotals(months),
      ]);
      const summaries: MonthlySummary[] = months.map((m) => {
        const inc = incomeTotals.find((t) => t.month === m.month && t.year === m.year)?.total ?? 0;
        const exp = expenseTotals.find((t) => t.month === m.month && t.year === m.year)?.total ?? 0;
        return { month: m.month, year: m.year, totalIncome: inc, totalExpenses: exp, balance: inc - exp };
      });
      setTrendData(summaries);
    }
    loadTrend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning,' : hour < 17 ? 'Good afternoon,' : 'Good evening,';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <FadeInView delay={0}>
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.muted }]}>{greeting}</Text>
              <Text style={[styles.name, { color: colors.text }]}>{settings?.userName || 'User'}</Text>
            </View>
            <Pressable
              style={[styles.notifBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => router.push('/settings')}
            >
              <MaterialIcons name="person-outline" size={20} color={colors.text} />
            </Pressable>
          </View>
        </FadeInView>

        {/* Month picker */}
        <FadeInView delay={80}>
          <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        </FadeInView>

        {/* Debit card */}
        <FadeInView delay={160} fromY={32}>
        <View style={styles.debitCard}>
          {/* Decorative circles */}
          <View style={[styles.cardCircle1, { backgroundColor: colors.accent + '18' }]} />
          <View style={[styles.cardCircle2, { backgroundColor: colors.accent + '10' }]} />

          {/* Top row: chip + logo */}
          <View style={styles.cardTopRow}>
            <View style={styles.chip}>
              <View style={styles.chipInner} />
              <View style={[styles.chipLine, styles.chipLineH]} />
              <View style={[styles.chipLine, styles.chipLineV]} />
            </View>
            <MaterialIcons name="account-balance-wallet" size={22} color={colors.accent} />
          </View>

          {/* Balance */}
          <View style={styles.cardMid}>
            <Text style={styles.cardBalanceLabel}>Total Balance</Text>
            <Text style={[styles.cardBalance, { color: balance >= 0 ? colors.accent : colors.negative }]}>
              {formatCurrency(animBalance, currency)}
            </Text>
          </View>

          {/* Bottom row: income / expenses */}
          <View style={styles.cardBottom}>
            <View style={styles.cardStat}>
              <View style={[styles.cardStatIcon, { backgroundColor: colors.positive + '25' }]}>
                <MaterialIcons name="arrow-downward" size={12} color={colors.positive} />
              </View>
              <View>
                <Text style={styles.cardStatLabel}>Income</Text>
                <Text style={[styles.cardStatValue, { color: colors.positive }]}>
                  {formatCurrency(animIncome, currency)}
                </Text>
              </View>
            </View>
            <View style={[styles.cardStatDivider, { backgroundColor: '#FFFFFF18' }]} />
            <View style={styles.cardStat}>
              <View style={[styles.cardStatIcon, { backgroundColor: colors.negative + '25' }]}>
                <MaterialIcons name="arrow-upward" size={12} color={colors.negative} />
              </View>
              <View>
                <Text style={styles.cardStatLabel}>Expenses</Text>
                <Text style={[styles.cardStatValue, { color: colors.negative }]}>
                  {formatCurrency(animExpenses, currency)}
                </Text>
              </View>
            </View>
          </View>
        </View>
        </FadeInView>

        {/* Quick actions */}
        <FadeInView delay={300}>
          <View style={styles.quickActions}>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/income/add')}
            >
              <MaterialIcons name="add" size={18} color="#000" />
              <Text style={styles.actionBtnText}>Add Income</Text>
            </Pressable>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, borderWidth: 1 }]}
              onPress={() => router.push('/expenses/add')}
            >
              <MaterialIcons name="remove" size={18} color={colors.text} />
              <Text style={[styles.actionBtnText, { color: colors.text }]}>Add Expense</Text>
            </Pressable>
          </View>
        </FadeInView>

        {/* Spending breakdown */}
        <FadeInView delay={400}>
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Breakdown</Text>
            <SpendingPie data={categorySpend} currencySymbol={currency} />
          </Card>
        </FadeInView>

        {/* Monthly trend */}
        <FadeInView delay={500}>
          <Card>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>6-Month Trend</Text>
              <View style={styles.chartLegend}>
                <View style={[styles.legendDot, { backgroundColor: colors.positive }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Income</Text>
                <View style={[styles.legendDot, { backgroundColor: colors.negative }]} />
                <Text style={[styles.legendText, { color: colors.muted }]}>Expenses</Text>
              </View>
            </View>
            <MonthlyTrendLine data={trendData} />
          </Card>
        </FadeInView>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  greeting: { fontSize: 13, fontWeight: '500' },
  name: { fontSize: 20, fontWeight: '800' },
  notifBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  debitCard: {
    borderRadius: 24,
    padding: 24,
    paddingBottom: 22,
    backgroundColor: '#161E12',
    borderWidth: 1,
    borderColor: '#AAFF0030',
    gap: 20,
    overflow: 'hidden',
    // shadow
    shadowColor: '#AAFF00',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  cardCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    top: -80,
    right: -60,
  },
  cardCircle2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -60,
    left: -40,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  // EMV chip
  chip: {
    width: 36,
    height: 28,
    borderRadius: 5,
    backgroundColor: '#D4A843',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chipInner: {
    position: 'absolute',
    width: 22,
    height: 18,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#B8922F',
  },
  chipLine: { position: 'absolute', backgroundColor: '#B8922F' },
  chipLineH: { width: 36, height: 1 },
  chipLineV: { width: 1, height: 28 },
  cardMid: { gap: 4 },
  cardBalanceLabel: { fontSize: 12, fontWeight: '500', color: '#FFFFFF70', letterSpacing: 0.5 },
  cardBalance: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  cardBottom: { flexDirection: 'row', alignItems: 'center' },
  cardStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardStatIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardStatLabel: { fontSize: 11, fontWeight: '500', color: '#FFFFFF60', marginBottom: 2 },
  cardStatValue: { fontSize: 14, fontWeight: '700' },
  cardStatDivider: { width: 1, height: 36, marginHorizontal: 16 },

  quickActions: { flexDirection: 'row', gap: 12 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 100,
    paddingVertical: 14,
  },
  actionBtnText: { fontWeight: '700', fontSize: 14, color: '#000' },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  chartLegend: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { fontSize: 11, marginRight: 6 },
});
