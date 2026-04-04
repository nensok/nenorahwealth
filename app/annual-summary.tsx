import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Svg, {
  Path, Defs, LinearGradient as SvgGradient, Stop,
  Line, Circle, Text as SvgText,
} from 'react-native-svg';
import { SpendingPie } from '@/components/charts/spending-pie';
import { useColors } from '@/hooks/use-colors';
import { useInvestmentStore } from '@/stores/investment-store';
import { useCategoryStore } from '@/stores/category-store';
import { useAppStore } from '@/stores/app-store';
import { getDb } from '@/lib/db/client';
import { getMonthlyIncomeTotals } from '@/lib/db/queries/income';
import { getMonthlyExpenseTotals, getCategorySpendByMonths } from '@/lib/db/queries/expenses';
import { formatCurrency } from '@/lib/utils/currency';
import { getMonthShort } from '@/lib/utils/date';
import { enrichInvestment } from '@/lib/utils/calculations';
import type { CategorySpend, InvestmentWithPnL, MonthlySummary } from '@/types';

// ─── Mini bar chart (12-month income vs expenses) ────────────────────────────
const BAR_H = 160;
const BAR_PAD_TOP = 12;
const BAR_PAD_BOTTOM = 22;
const BAR_PAD_H = 8;

function AnnualBarChart({
  data,
  currency,
}: {
  data: MonthlySummary[];
  currency: string;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const chartWidth = screenWidth - 32 - 40; // scroll padding + card padding
  const innerH = BAR_H - BAR_PAD_TOP - BAR_PAD_BOTTOM;
  const n = data.length;
  const maxVal = Math.max(...data.map((d) => Math.max(d.totalIncome, d.totalExpenses)), 1);
  const slotW = (chartWidth - BAR_PAD_H * 2) / n;
  const barW = Math.max(slotW * 0.35, 3);
  const gap = slotW * 0.08;

  function barY(val: number) {
    return BAR_PAD_TOP + (1 - val / maxVal) * innerH;
  }
  function barHeight(val: number) {
    return (val / maxVal) * innerH;
  }

  const bottomY = BAR_PAD_TOP + innerH;

  return (
    <Svg width={chartWidth} height={BAR_H}>
      <Defs>
        <SvgGradient id="incBar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#4ADE80" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#4ADE80" stopOpacity="0.4" />
        </SvgGradient>
        <SvgGradient id="expBar" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#F87171" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#F87171" stopOpacity="0.4" />
        </SvgGradient>
      </Defs>

      {/* Baseline */}
      <Line
        x1={BAR_PAD_H} y1={bottomY}
        x2={chartWidth - BAR_PAD_H} y2={bottomY}
        stroke="rgba(255,255,255,0.1)" strokeWidth="1"
      />

      {data.map((d, i) => {
        const centerX = BAR_PAD_H + i * slotW + slotW / 2;
        const incX = centerX - barW - gap / 2;
        return (
          <Path
            key={`i${i}`}
            d={`M ${incX.toFixed(1)} ${bottomY} L ${incX.toFixed(1)} ${barY(d.totalIncome).toFixed(1)} L ${(incX + barW).toFixed(1)} ${barY(d.totalIncome).toFixed(1)} L ${(incX + barW).toFixed(1)} ${bottomY} Z`}
            fill="url(#incBar)"
          />
        );
      })}

      {data.map((d, i) => {
        const centerX = BAR_PAD_H + i * slotW + slotW / 2;
        const expX = centerX + gap / 2;
        const isOver = d.totalExpenses > d.totalIncome && d.totalExpenses > 0;
        return (
          <Path
            key={`e${i}`}
            d={`M ${expX.toFixed(1)} ${bottomY} L ${expX.toFixed(1)} ${barY(d.totalExpenses).toFixed(1)} L ${(expX + barW).toFixed(1)} ${barY(d.totalExpenses).toFixed(1)} L ${(expX + barW).toFixed(1)} ${bottomY} Z`}
            fill={isOver ? '#F87171CC' : 'url(#expBar)'}
          />
        );
      })}

      {/* Month labels */}
      {data.map((d, i) => {
        const centerX = BAR_PAD_H + i * slotW + slotW / 2;
        return (
          <SvgText
            key={`l${i}`}
            x={centerX.toFixed(1)}
            y={BAR_H - 5}
            fontSize="9"
            fill="rgba(255,255,255,0.4)"
            textAnchor="middle"
          >
            {getMonthShort(d.month)}
          </SvgText>
        );
      })}
    </Svg>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function AnnualSummaryScreen() {
  const colors = useColors();
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.load);
  const investments = useInvestmentStore((s) => s.positions);
  const loadInvestments = useInvestmentStore((s) => s.load);

  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummary[]>([]);
  const [categorySpend, setCategorySpend] = useState<CategorySpend[]>([]);

  const months = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, year }));

  useEffect(() => {
    loadCategories();
    loadInvestments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const db = await getDb();
      const [incTotals, expTotals, catRaw] = await Promise.all([
        getMonthlyIncomeTotals(db, months),
        getMonthlyExpenseTotals(db, months),
        getCategorySpendByMonths(db, months),
      ]);

      const summaries: MonthlySummary[] = months.map((m, i) => ({
        month: m.month,
        year: m.year,
        totalIncome: incTotals[i]?.total ?? 0,
        totalExpenses: expTotals[i]?.total ?? 0,
        balance: (incTotals[i]?.total ?? 0) - (expTotals[i]?.total ?? 0),
      }));
      setMonthlySummaries(summaries);

      // Aggregate category spend for the year
      const catTotals = new Map<number, number>();
      for (const pt of catRaw) {
        catTotals.set(pt.categoryId, (catTotals.get(pt.categoryId) ?? 0) + pt.total);
      }
      const yearExpTotal = Array.from(catTotals.values()).reduce((s, v) => s + v, 0);
      const catSpend: CategorySpend[] = [];
      for (const [catId, total] of catTotals) {
        const cat = categories.find((c) => c.id === catId);
        if (cat) {
          catSpend.push({ category: cat, total, percentage: yearExpTotal > 0 ? (total / yearExpTotal) * 100 : 0 });
        }
      }
      catSpend.sort((a, b) => b.total - a.total);
      setCategorySpend(catSpend);
      setLoading(false);
    }
    if (categories.length > 0) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, categories]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const totalIncome = monthlySummaries.reduce((s, m) => s + m.totalIncome, 0);
  const totalExpenses = monthlySummaries.reduce((s, m) => s + m.totalExpenses, 0);
  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.max(0, (netSavings / totalIncome) * 100) : 0;
  const isDeficit = netSavings < 0;

  const overspendMonths = monthlySummaries.filter(
    (m) => m.totalExpenses > m.totalIncome && m.totalExpenses > 0,
  );

  const bestMonth = monthlySummaries.reduce<MonthlySummary | null>((best, m) => {
    if (m.totalIncome === 0 && m.totalExpenses === 0) return best;
    if (!best) return m;
    return m.balance > best.balance ? m : best;
  }, null);

  const worstMonth = monthlySummaries.reduce<MonthlySummary | null>((worst, m) => {
    if (m.totalIncome === 0 && m.totalExpenses === 0) return worst;
    if (!worst) return m;
    return m.balance < worst.balance ? m : worst;
  }, null);

  const enrichedInvestments: InvestmentWithPnL[] = investments.map(enrichInvestment);
  const totalPortfolioValue = enrichedInvestments.reduce((s, i) => s + i.portfolioValue, 0);
  const totalCostBasis = enrichedInvestments.reduce((s, i) => s + i.quantity * i.buyPrice, 0);
  const totalPnL = totalPortfolioValue - totalCostBasis;
  const totalPnLPct = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

  const hasAnyData = totalIncome > 0 || totalExpenses > 0;

  // ── Savings ring arc ────────────────────────────────────────────────────────
  const RING_R = 38;
  const RING_CX = 48;
  const RING_CY = 48;
  const RING_STROKE = 8;
  const circumference = 2 * Math.PI * RING_R;
  const arc = circumference * (savingsRate / 100);

  function ringArc(pct: number) {
    const r = RING_R;
    const cx = RING_CX;
    const cy = RING_CY;
    const startAngle = -90;
    const endAngle = startAngle + (pct / 100) * 360;
    const large = pct > 50 ? 1 : 0;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = (cx + r * Math.cos(toRad(startAngle))).toFixed(2);
    const y1 = (cy + r * Math.sin(toRad(startAngle))).toFixed(2);
    const x2 = (cx + r * Math.cos(toRad(endAngle))).toFixed(2);
    const y2 = (cy + r * Math.sin(toRad(endAngle))).toFixed(2);
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Year in Review</Text>
          <Text style={[styles.headerSub, { color: colors.muted }]}>Annual Financial Summary</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Year selector */}
        <View style={styles.yearRow}>
          <Pressable
            onPress={() => setYear((y) => y - 1)}
            style={[styles.yearArrow, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <MaterialIcons name="chevron-left" size={20} color={colors.text} />
          </Pressable>
          <Text style={[styles.yearLabel, { color: colors.text }]}>{year}</Text>
          <Pressable
            onPress={() => setYear((y) => Math.min(y + 1, new Date().getFullYear()))}
            style={[styles.yearArrow, { backgroundColor: colors.surface, borderColor: colors.border }]}
            disabled={year >= new Date().getFullYear()}
          >
            <MaterialIcons name="chevron-right" size={20} color={year >= new Date().getFullYear() ? colors.muted : colors.text} />
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={[styles.loadingText, { color: colors.muted }]}>Crunching numbers…</Text>
          </View>
        ) : !hasAnyData ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceElevated }]}>
              <MaterialIcons name="bar-chart" size={40} color={colors.muted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No data for {year}</Text>
            <Text style={[styles.emptyBody, { color: colors.muted }]}>Add income and expenses to see your annual review.</Text>
          </View>
        ) : (
          <>
            {/* ── Hero card ─────────────────────────────────────────── */}
            <View style={styles.heroCard}>
              {/* Decorative circles */}
              <View style={styles.heroBubble1} />
              <View style={styles.heroBubble2} />
              <View style={styles.heroBubble3} />

              <View style={styles.heroTopRow}>
                <View>
                  <Text style={styles.heroYearTag}>{year}</Text>
                  <Text style={styles.heroNetLabel}>{isDeficit ? 'NET DEFICIT' : 'NET SAVINGS'}</Text>
                  <Text style={[styles.heroAmount, { color: isDeficit ? '#FF6B6B' : '#4ADE80' }]}>
                    {isDeficit ? '-' : ''}{formatCurrency(Math.abs(netSavings), currency)}
                  </Text>
                </View>

                {/* Savings rate ring */}
                <View style={styles.ringWrap}>
                  <Svg width={96} height={96}>
                    {/* Track */}
                    <Circle cx={RING_CX} cy={RING_CY} r={RING_R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={RING_STROKE} />
                    {/* Arc */}
                    {savingsRate > 0 && (
                      <Path
                        d={ringArc(Math.min(savingsRate, 100))}
                        fill="none"
                        stroke={isDeficit ? '#FF6B6B' : '#4ADE80'}
                        strokeWidth={RING_STROKE}
                        strokeLinecap="round"
                      />
                    )}
                    <SvgText x={RING_CX} y={RING_CY - 8} textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">
                      {Math.round(savingsRate)}%
                    </SvgText>
                    <SvgText x={RING_CX} y={RING_CY + 8} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">
                      SAVED
                    </SvgText>
                  </Svg>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.heroDivider} />

              {/* Bottom: income vs expenses */}
              <View style={styles.heroBottomRow}>
                <View style={styles.heroStat}>
                  <View style={styles.heroStatDot}>
                    <View style={[styles.heroDotInner, { backgroundColor: '#4ADE80' }]} />
                  </View>
                  <Text style={styles.heroStatLabel}>INCOME</Text>
                  <Text style={styles.heroStatValue}>{formatCurrency(totalIncome, currency)}</Text>
                </View>
                <View style={[styles.heroStatDivider]} />
                <View style={styles.heroStat}>
                  <View style={styles.heroStatDot}>
                    <View style={[styles.heroDotInner, { backgroundColor: '#F87171' }]} />
                  </View>
                  <Text style={styles.heroStatLabel}>EXPENSES</Text>
                  <Text style={[styles.heroStatValue, totalExpenses > totalIncome && { color: '#FF6B6B' }]}>
                    {formatCurrency(totalExpenses, currency)}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Best / Worst month pills ──────────────────────────── */}
            <View style={styles.pillRow}>
              {bestMonth && bestMonth.balance > 0 && (
                <View style={[styles.pill, { backgroundColor: '#4ADE8015', borderColor: '#4ADE8040' }]}>
                  <MaterialIcons name="trending-up" size={14} color="#4ADE80" />
                  <Text style={[styles.pillText, { color: '#4ADE80' }]}>
                    Best: {getMonthShort(bestMonth.month)} +{formatCurrency(bestMonth.balance, currency)}
                  </Text>
                </View>
              )}
              {worstMonth && worstMonth.balance < 0 && (
                <View style={[styles.pill, { backgroundColor: '#F8717115', borderColor: '#F8717140' }]}>
                  <MaterialIcons name="trending-down" size={14} color="#F87171" />
                  <Text style={[styles.pillText, { color: '#F87171' }]}>
                    Worst: {getMonthShort(worstMonth.month)} {formatCurrency(worstMonth.balance, currency)}
                  </Text>
                </View>
              )}
            </View>

            {/* ── 12-month bar chart ────────────────────────────────── */}
            <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Monthly Breakdown</Text>
                <View style={styles.legend}>
                  <View style={[styles.legendDot, { backgroundColor: '#4ADE80' }]} />
                  <Text style={[styles.legendLabel, { color: colors.muted }]}>Income</Text>
                  <View style={[styles.legendDot, { backgroundColor: '#F87171' }]} />
                  <Text style={[styles.legendLabel, { color: colors.muted }]}>Expenses</Text>
                </View>
              </View>
              <AnnualBarChart data={monthlySummaries} currency={currency} />
            </View>

            {/* ── Overspend months ─────────────────────────────────── */}
            {overspendMonths.length > 0 && (
              <View style={[styles.alertBox, { backgroundColor: '#F8717108', borderColor: '#F8717130' }]}>
                <View style={styles.alertHeader}>
                  <MaterialIcons name="warning-amber" size={16} color="#F87171" />
                  <Text style={[styles.alertTitle, { color: '#F87171' }]}>
                    Overspent in {overspendMonths.length} month{overspendMonths.length > 1 ? 's' : ''}
                  </Text>
                </View>
                <View style={styles.alertChips}>
                  {overspendMonths.map((m) => (
                    <View key={m.month} style={styles.alertChip}>
                      <Text style={styles.alertChipMonth}>{getMonthShort(m.month)}</Text>
                      <Text style={styles.alertChipAmt}>
                        -{formatCurrency(m.totalExpenses - m.totalIncome, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Category spending breakdown ───────────────────────── */}
            {categorySpend.length > 0 && (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Spending Breakdown</Text>
                  <Text style={[styles.sectionSub, { color: colors.muted }]}>Full year by category</Text>
                </View>
                <SpendingPie data={categorySpend} currencySymbol={currency} />
              </View>
            )}

            {/* ── Investment snapshot ───────────────────────────────── */}
            {enrichedInvestments.length > 0 && (
              <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Investment Portfolio</Text>
                  <Text style={[styles.sectionSub, { color: colors.muted }]}>Current snapshot</Text>
                </View>

                {/* Portfolio totals */}
                <View style={[styles.portfolioSummary, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={styles.portfolioStat}>
                    <Text style={[styles.portfolioStatLabel, { color: colors.muted }]}>Portfolio Value</Text>
                    <Text style={[styles.portfolioStatValue, { color: colors.text }]}>
                      {formatCurrency(totalPortfolioValue, currency)}
                    </Text>
                  </View>
                  <View style={[styles.portfolioStatDivider, { backgroundColor: colors.border }]} />
                  <View style={styles.portfolioStat}>
                    <Text style={[styles.portfolioStatLabel, { color: colors.muted }]}>Total P&L</Text>
                    <Text style={[styles.portfolioStatValue, { color: totalPnL >= 0 ? colors.positive : colors.negative }]}>
                      {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL, currency)}
                    </Text>
                    <Text style={[styles.portfolioPct, { color: totalPnL >= 0 ? colors.positive : colors.negative }]}>
                      {totalPnL >= 0 ? '+' : ''}{totalPnLPct.toFixed(1)}%
                    </Text>
                  </View>
                </View>

                {/* Per-holding rows */}
                <View style={styles.holdingsList}>
                  {enrichedInvestments.map((inv) => {
                    const isGain = inv.profitLoss >= 0;
                    const pnlColor = isGain ? colors.positive : colors.negative;
                    return (
                      <Pressable
                        key={inv.id}
                        onPress={() => router.push(`/investments/${inv.id}`)}
                        style={[styles.holdingRow, { borderBottomColor: colors.border }]}
                      >
                        <View style={[styles.holdingBadge, { backgroundColor: pnlColor + '20' }]}>
                          <MaterialIcons
                            name={isGain ? 'trending-up' : 'trending-down'}
                            size={16}
                            color={pnlColor}
                          />
                        </View>
                        <View style={styles.holdingInfo}>
                          <Text style={[styles.holdingName, { color: colors.text }]}>
                            {inv.stockName}
                            {inv.ticker ? ` · ${inv.ticker}` : ''}
                          </Text>
                          <Text style={[styles.holdingQty, { color: colors.muted }]}>
                            {inv.quantity} units @ {formatCurrency(inv.currentPrice, currency)}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={[styles.holdingValue, { color: colors.text }]}>
                            {formatCurrency(inv.portfolioValue, currency)}
                          </Text>
                          <Text style={[styles.holdingPnL, { color: pnlColor }]}>
                            {isGain ? '+' : ''}{formatCurrency(inv.profitLoss, currency)} ({inv.profitLossPercent >= 0 ? '+' : ''}{inv.profitLossPercent.toFixed(1)}%)
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Avg monthly income/expense ───────────────────────── */}
            <View style={styles.avgRow}>
              {[
                { label: 'Avg Monthly Income', value: totalIncome / 12, color: colors.positive },
                { label: 'Avg Monthly Expenses', value: totalExpenses / 12, color: colors.negative },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[styles.avgCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <MaterialIcons
                    name={item.color === colors.positive ? 'arrow-downward' : 'arrow-upward'}
                    size={18}
                    color={item.color}
                  />
                  <Text style={[styles.avgValue, { color: colors.text }]}>
                    {formatCurrency(item.value, currency)}
                  </Text>
                  <Text style={[styles.avgLabel, { color: colors.muted }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 14, borderBottomWidth: 1, gap: 12,
  },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSub: { fontSize: 12, marginTop: 1 },

  // Scroll
  scroll: { padding: 16, gap: 16, paddingBottom: 48 },

  // Year selector
  yearRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  yearArrow: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  yearLabel: { fontSize: 28, fontWeight: '800', minWidth: 80, textAlign: 'center' },

  // Loading / empty
  loadingWrap: { alignItems: 'center', paddingVertical: 60, gap: 16 },
  loadingText: { fontSize: 14 },
  emptyWrap: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: '700' },
  emptyBody: { fontSize: 13, textAlign: 'center', maxWidth: 280 },

  // Hero card
  heroCard: {
    borderRadius: 28, padding: 24, overflow: 'hidden',
    backgroundColor: '#0F172A',
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5, shadowRadius: 24, elevation: 16,
  },
  heroBubble1: {
    position: 'absolute', width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(74,222,128,0.07)', top: -80, right: -60,
  },
  heroBubble2: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(99,102,241,0.06)', bottom: -40, left: -30,
  },
  heroBubble3: {
    position: 'absolute', width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(248,113,113,0.05)', top: 40, left: '50%',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  heroYearTag: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.35)', letterSpacing: 2, marginBottom: 6 },
  heroNetLabel: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginBottom: 6 },
  heroAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  ringWrap: { marginTop: -4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 20 },
  heroBottomRow: { flexDirection: 'row', gap: 0 },
  heroStat: { flex: 1, gap: 4 },
  heroStatDot: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroDotInner: { width: 7, height: 7, borderRadius: 4 },
  heroStatLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.2, marginBottom: 2 },
  heroStatValue: { fontSize: 16, fontWeight: '700', color: '#fff' },
  heroStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 16 },

  // Pills (best/worst)
  pillRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, flexShrink: 1 },
  pillText: { fontSize: 12, fontWeight: '600' },

  // Section card
  section: { borderRadius: 22, borderWidth: 1, padding: 20, gap: 16 },
  sectionHeader: { gap: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  sectionSub: { fontSize: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, fontWeight: '500', marginRight: 6 },

  // Overspend alert
  alertBox: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  alertTitle: { fontSize: 14, fontWeight: '700' },
  alertChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  alertChip: {
    backgroundColor: 'rgba(248,113,113,0.12)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 6, gap: 2,
  },
  alertChipMonth: { fontSize: 12, fontWeight: '700', color: '#F87171' },
  alertChipAmt: { fontSize: 10, color: '#F8717190' },

  // Portfolio
  portfolioSummary: { flexDirection: 'row', borderRadius: 16, borderWidth: 1, padding: 16 },
  portfolioStat: { flex: 1, gap: 4 },
  portfolioStatLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  portfolioStatValue: { fontSize: 18, fontWeight: '800' },
  portfolioPct: { fontSize: 12, fontWeight: '600' },
  portfolioStatDivider: { width: 1, marginHorizontal: 16 },
  holdingsList: { gap: 0 },
  holdingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  holdingBadge: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  holdingInfo: { flex: 1 },
  holdingName: { fontSize: 14, fontWeight: '700' },
  holdingQty: { fontSize: 11, marginTop: 2 },
  holdingValue: { fontSize: 14, fontWeight: '700' },
  holdingPnL: { fontSize: 11, marginTop: 2 },

  // Avg cards
  avgRow: { flexDirection: 'row', gap: 12 },
  avgCard: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 16, gap: 6, alignItems: 'flex-start' },
  avgValue: { fontSize: 17, fontWeight: '800' },
  avgLabel: { fontSize: 11, fontWeight: '500', lineHeight: 16 },
});
