import { useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Pressable, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FadeInView } from '@/components/ui/fade-in-view';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MonthPicker } from '@/components/ui/month-picker';
import { ListItem } from '@/components/ui/list-item';
import { EmptyState } from '@/components/ui/empty-state';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useColors } from '@/hooks/use-colors';
import { useIncomeStore } from '@/stores/income-store';
import { useAppStore } from '@/stores/app-store';
import { getCurrentMonthYear } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import type { Income } from '@/types';

export default function IncomeScreen() {
  const colors = useColors();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);

  const settings = useAppStore((s) => s.settings);
  const currency = settings?.currencySymbol ?? '₦';
  const records = useIncomeStore((s) => s.records);
  const loadByMonth = useIncomeStore((s) => s.loadByMonth);
  const getMonthlyTotal = useIncomeStore((s) => s.getMonthlyTotal);

  useEffect(() => {
    loadByMonth(month, year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  function renderItem({ item, index }: { item: Income; index: number }) {
    return (
      <ListItem
        title={item.source}
        subtitle={item.notes}
        amount={item.amount}
        amountColor={colors.positive}
        currencySymbol={currency}
        accentColor={colors.positive}
        onPress={() => router.push(`/income/${item.id}`)}
        index={index}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Income" subtitle="Track your earnings" accentColor={colors.positive} />
      {/* Summary header */}
      <FadeInView delay={0}>
      <View style={[styles.summaryHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View>
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>Total Income</Text>
          <Text style={[styles.summaryAmount, { color: colors.positive }]}>
            {formatCurrency(getMonthlyTotal(), currency)}
          </Text>
        </View>
        <View style={[styles.summaryIcon, { backgroundColor: colors.positive + '20' }]}>
          <MaterialIcons name="arrow-downward" size={24} color={colors.positive} />
        </View>
      </View>
      </FadeInView>

      <FadeInView delay={120}>
      <View style={styles.pickerRow}>
        <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </View>
      </FadeInView>

      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={records.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="account-balance-wallet"
            title="No income this month"
            body="Tap the + button to record your income."
          />
        }
      />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/income/add')}
      >
        <MaterialIcons name="add" size={28} color="#000" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  summaryLabel: { fontSize: 13, fontWeight: '500' },
  summaryAmount: { fontSize: 26, fontWeight: '800', marginTop: 2 },
  summaryIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  pickerRow: { paddingHorizontal: 16, marginBottom: 8 },
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
    shadowColor: '#AAFF00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
