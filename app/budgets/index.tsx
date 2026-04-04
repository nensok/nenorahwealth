import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenHeader } from '@/components/ui/screen-header';
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

  const setCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgeted = categories.filter((c) => !setCategoryIds.has(c.id));

  const totalBudget = budgetsWithSpend.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetsWithSpend.reduce((sum, b) => sum + b.spent, 0);
  const overallPct = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;
  const isOverall = totalSpent > totalBudget && totalBudget > 0;

  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Budgets" subtitle={monthLabel} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Credit-card style overview */}
        {budgetsWithSpend.length > 0 && (
          <View style={[styles.creditCard, { width: width - 32 }]}>
            {/* Decorative circles */}
            <View style={styles.circle1} />
            <View style={styles.circle2} />

            {/* Top row: chip icon + month */}
            <View style={styles.ccTopRow}>
              <View style={styles.ccChip}>
                <View style={styles.ccChipInner} />
              </View>
              <Text style={styles.ccMonth}>{monthLabel}</Text>
            </View>

            {/* Spent amount — hero figure */}
            <Text style={styles.ccSpentLabel}>SPENT</Text>
            <Text style={[styles.ccSpentAmount, { color: isOverall ? '#FF6B6B' : '#fff' }]}>
              {formatCurrency(totalSpent, currency)}
            </Text>

            {/* Progress bar */}
            <View style={styles.ccTrackBg}>
              <View style={[styles.ccTrackFill, { width: `${overallPct}%`, backgroundColor: isOverall ? '#FF6B6B' : '#fff' }]} />
            </View>

            {/* Bottom row: budget + remaining */}
            <View style={styles.ccBottomRow}>
              <View>
                <Text style={styles.ccSubLabel}>BUDGET</Text>
                <Text style={styles.ccSubValue}>{formatCurrency(totalBudget, currency)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.ccSubLabel}>{isOverall ? 'OVER BY' : 'REMAINING'}</Text>
                <Text style={[styles.ccSubValue, { color: isOverall ? '#FF6B6B' : 'rgba(255,255,255,0.9)' }]}>
                  {formatCurrency(Math.abs(totalBudget - totalSpent), currency)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Budget cards */}
        {budgetsWithSpend.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceElevated }]}>
              <MaterialIcons name="account-balance" size={32} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No budgets set</Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>Tap a category below to set a monthly budget.</Text>
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>ACTIVE BUDGETS</Text>
            <View style={styles.cardsGroup}>
              {budgetsWithSpend.map((item) => {
                const cat = categories.find((c) => c.id === item.categoryId);
                const isOver = item.spent > item.amount;
                const accentColor = isOver ? colors.negative : (cat?.color ?? colors.accent);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => router.push(`/budgets/${item.categoryId}`)}
                    style={[styles.budgetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    {/* Left accent bar */}
                    <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

                    <View style={styles.budgetBody}>
                      <View style={styles.budgetTop}>
                        <View style={[styles.catBadge, { backgroundColor: accentColor + '20' }]}>
                          <Text style={[styles.catInitial, { color: accentColor }]}>
                            {cat?.name?.charAt(0) ?? '?'}
                          </Text>
                        </View>
                        <View style={styles.budgetMeta}>
                          <Text style={[styles.catName, { color: colors.text }]}>{cat?.name ?? 'Unknown'}</Text>
                          <Text style={[styles.remaining, { color: isOver ? colors.negative : colors.muted }]}>
                            {isOver
                              ? `Over by ${formatCurrency(item.spent - item.amount, currency)}`
                              : `${formatCurrency(item.remaining, currency)} remaining`}
                          </Text>
                        </View>
                        <Text style={[styles.pctBadge, { color: accentColor, backgroundColor: accentColor + '15' }]}>
                          {Math.round(item.percentage)}%
                        </Text>
                      </View>

                      {/* Progress bar */}
                      <View style={[styles.trackBg, { backgroundColor: colors.surfaceElevated }]}>
                        <View style={[styles.trackFill, { width: `${item.percentage}%`, backgroundColor: accentColor }]} />
                      </View>

                      <View style={styles.budgetFooter}>
                        <Text style={[styles.spentLabel, { color: colors.muted }]}>
                          Spent: <Text style={{ color: colors.text, fontWeight: '600' }}>{formatCurrency(item.spent, currency)}</Text>
                        </Text>
                        <Text style={[styles.spentLabel, { color: colors.muted }]}>
                          Budget: <Text style={{ color: colors.text, fontWeight: '600' }}>{formatCurrency(item.amount, currency)}</Text>
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {/* Unbudgeted categories */}
        {unbudgeted.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.muted }]}>ADD BUDGET FOR</Text>
            <View style={styles.cardsGroup}>
              {unbudgeted.map((cat: Category) => (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/budgets/${cat.id}`)}
                  style={[styles.unbudgetedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.catBadge, { backgroundColor: cat.color + '20' }]}>
                    <Text style={[styles.catInitial, { color: cat.color }]}>{cat.name.charAt(0)}</Text>
                  </View>
                  <Text style={[styles.catName, { color: colors.text, flex: 1 }]}>{cat.name}</Text>
                  <View style={[styles.addChip, { backgroundColor: colors.accent + '15', borderColor: colors.accent + '40' }]}>
                    <MaterialIcons name="add" size={14} color={colors.accent} />
                    <Text style={[styles.addChipText, { color: colors.accent }]}>Set budget</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 4, paddingBottom: 48 },

  creditCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 8,
    backgroundColor: '#1A1F3C',
    overflow: 'hidden',
    gap: 6,
    minHeight: 200,
    shadowColor: '#1A1F3C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 12,
  },
  circle1: {
    position: 'absolute', width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -40,
  },
  circle2: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.04)', bottom: -30, left: 20,
  },
  ccTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  ccChip: {
    width: 36, height: 26, borderRadius: 6,
    backgroundColor: 'rgba(255,215,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },
  ccChipInner: {
    width: 22, height: 14, borderRadius: 3,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.25)',
  },
  ccMonth: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },
  ccSpentLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5 },
  ccSpentAmount: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  ccTrackBg: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', marginBottom: 16 },
  ccTrackFill: { height: 4, borderRadius: 2 },
  ccBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  ccSubLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, marginBottom: 2 },
  ccSubValue: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },

  section: { gap: 10, marginTop: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, paddingLeft: 2 },
  cardsGroup: { gap: 10 },

  budgetCard: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden',
    flexDirection: 'row',
  },
  accentBar: { width: 4, borderRadius: 0 },
  budgetBody: { flex: 1, padding: 16, gap: 12 },
  budgetTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  catBadge: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  catInitial: { fontSize: 16, fontWeight: '800' },
  budgetMeta: { flex: 1 },
  catName: { fontSize: 15, fontWeight: '700' },
  remaining: { fontSize: 12, fontWeight: '500', marginTop: 1 },
  pctBadge: { fontSize: 13, fontWeight: '800', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  trackBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  trackFill: { height: 6, borderRadius: 3 },
  budgetFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  spentLabel: { fontSize: 12 },

  unbudgetedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, borderWidth: 1, padding: 14,
  },
  addChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
  addChipText: { fontSize: 12, fontWeight: '600' },

  emptyWrap: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIcon: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center', maxWidth: 260 },
});
