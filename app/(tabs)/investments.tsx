import { useEffect } from 'react';
import { View, FlatList, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FadeInView } from '@/components/ui/fade-in-view';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ListItem } from '@/components/ui/list-item';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useColors } from '@/hooks/use-colors';
import { useInvestmentStore } from '@/stores/investment-store';
import { useAppStore } from '@/stores/app-store';
import { enrichInvestment } from '@/lib/utils/calculations';
import { formatCurrency } from '@/lib/utils/currency';
import type { InvestmentWithPnL } from '@/types';

// Gold palette — fixed for the physical card look regardless of app theme
const CARD_BG = '#1A1400';
const CARD_GOLD = '#F0C040';
const CARD_GOLD_DIM = '#B8922F';

export default function InvestmentsScreen() {
  const colors = useColors();
  const settings = useAppStore((s) => s.settings);
  const currency = settings?.currencySymbol ?? '₦';
  const load = useInvestmentStore((s) => s.load);
  const rawPositions = useInvestmentStore((s) => s.positions);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const positions = rawPositions.map(enrichInvestment);
  const totalValue = rawPositions.reduce((sum, p) => sum + p.quantity * p.currentPrice, 0);
  const totalPnL = rawPositions.reduce((sum, p) => sum + (p.currentPrice - p.buyPrice) * p.quantity, 0);
  const isPositive = totalPnL >= 0;
  const pnlColor = isPositive ? '#00E676' : '#FF4D4D';

  function renderItem({ item, index }: { item: InvestmentWithPnL; index: number }) {
    const pnlLabel = `${item.profitLoss >= 0 ? '+' : ''}${formatCurrency(item.profitLoss, currency)} (${item.profitLossPercent.toFixed(1)}%)`;
    return (
      <ListItem
        title={item.stockName}
        subtitle={`${item.ticker ? item.ticker + ' · ' : ''}${item.quantity} units`}
        amount={item.portfolioValue}
        amountColor={item.profitLoss >= 0 ? colors.positive : colors.negative}
        currencySymbol={currency}
        accentColor={item.profitLoss >= 0 ? colors.positive : colors.negative}
        rightLabel={pnlLabel}
        onPress={() => router.push(`/investments/${item.id}`)}
        index={index}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Investments" subtitle="Your portfolio" accentColor={CARD_GOLD} />

      {/* Portfolio credit card */}
      <FadeInView delay={0}>
        <View style={styles.card}>
          {/* Decorative circles */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />

          {/* Top row: EMV chip + chart icon */}
          <View style={styles.cardTopRow}>
            <View style={styles.chip}>
              <View style={styles.chipInner} />
              <View style={[styles.chipLine, styles.chipLineH]} />
              <View style={[styles.chipLine, styles.chipLineV]} />
            </View>
            <MaterialIcons name="show-chart" size={22} color={CARD_GOLD} />
          </View>

          {/* Portfolio value */}
          <View style={styles.cardMid}>
            <Text style={styles.cardBalanceLabel}>Portfolio Value</Text>
            <Text style={[styles.cardBalance, { color: CARD_GOLD }]}>
              {formatCurrency(totalValue, currency)}
            </Text>
          </View>

          {/* Bottom row: P&L + positions */}
          <View style={styles.cardBottom}>
            <View style={styles.cardStat}>
              <View style={[styles.cardStatIcon, { backgroundColor: pnlColor + '25' }]}>
                <MaterialIcons name={isPositive ? 'trending-up' : 'trending-down'} size={13} color={pnlColor} />
              </View>
              <View>
                <Text style={styles.cardStatLabel}>Total P&L</Text>
                <Text style={[styles.cardStatValue, { color: pnlColor }]}>
                  {isPositive ? '+' : ''}{formatCurrency(Math.abs(totalPnL), currency)}
                </Text>
              </View>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardStat}>
              <View style={[styles.cardStatIcon, { backgroundColor: CARD_GOLD + '25' }]}>
                <MaterialIcons name="business-center" size={13} color={CARD_GOLD} />
              </View>
              <View>
                <Text style={styles.cardStatLabel}>Positions</Text>
                <Text style={[styles.cardStatValue, { color: CARD_GOLD }]}>{positions.length}</Text>
              </View>
            </View>
          </View>
        </View>
      </FadeInView>

      <Text style={[styles.listHeader, { color: colors.muted }]}>
        {positions.length > 0 ? `${positions.length} Position${positions.length > 1 ? 's' : ''}` : 'Positions'}
      </Text>

      <FlatList
        data={positions}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={positions.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="show-chart"
            title="No investments yet"
            body="Tap + to add your first investment position."
          />
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: CARD_GOLD }]}
        onPress={() => router.push('/investments/add')}
      >
        <MaterialIcons name="add" size={28} color="#000" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // ── Portfolio credit card ─────────────────────────────────────────────────
  card: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
    paddingBottom: 22,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: CARD_GOLD + '30',
    gap: 20,
    overflow: 'hidden',
    shadowColor: CARD_GOLD,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: CARD_GOLD + '12',
    top: -70,
    right: -50,
  },
  circle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: CARD_GOLD + '08',
    bottom: -55,
    left: -35,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chip: {
    width: 36,
    height: 28,
    borderRadius: 5,
    backgroundColor: CARD_GOLD,
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
    borderColor: CARD_GOLD_DIM,
  },
  chipLine: { position: 'absolute', backgroundColor: CARD_GOLD_DIM },
  chipLineH: { width: 36, height: 1 },
  chipLineV: { width: 1, height: 28 },
  cardMid: { gap: 4 },
  cardBalanceLabel: { fontSize: 12, fontWeight: '500', color: '#FFFFFF70', letterSpacing: 0.5 },
  cardBalance: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  cardBottom: { flexDirection: 'row', alignItems: 'center' },
  cardStat: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardStatIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  cardStatLabel: { fontSize: 11, fontWeight: '500', color: '#FFFFFF60', marginBottom: 2 },
  cardStatValue: { fontSize: 14, fontWeight: '700' },
  cardDivider: { width: 1, height: 36, marginHorizontal: 16, backgroundColor: '#FFFFFF18' },

  // ── List ──────────────────────────────────────────────────────────────────
  listHeader: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 4 },
  listContent: { paddingVertical: 4 },
  emptyContainer: { flex: 1 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: CARD_GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
