import { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState } from '@/components/ui/empty-state';
import { useColors } from '@/hooks/use-colors';
import { useRecurringStore } from '@/stores/recurring-store';
import { useCategoryStore } from '@/stores/category-store';
import { useAppStore } from '@/stores/app-store';
import { formatCurrency } from '@/lib/utils/currency';
import type { RecurringTransaction } from '@/types';

const FREQ_LABEL: Record<string, string> = {
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export default function RecurringScreen() {
  const colors = useColors();
  const items = useRecurringStore((s) => s.items);
  const load = useRecurringStore((s) => s.load);
  const update = useRecurringStore((s) => s.update);
  const getById = useCategoryStore((s) => s.getById);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function renderItem({ item }: { item: RecurringTransaction }) {
    const isIncome = item.type === 'income';
    const cat = item.categoryId ? getById(item.categoryId) : undefined;
    const accentColor = isIncome ? colors.positive : colors.negative;

    return (
      <Pressable
        onPress={() => router.push(`/recurring/${item.id}`)}
        style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.iconWrap, { backgroundColor: accentColor + '20' }]}>
          <MaterialIcons
            name={isIncome ? 'arrow-downward' : 'arrow-upward'}
            size={18}
            color={accentColor}
          />
        </View>

        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.sub, { color: colors.muted }]}>
            {FREQ_LABEL[item.frequency]}
            {cat ? ` · ${cat.name}` : ''}
            {' · Next: '}{item.nextDueDate}
          </Text>
        </View>

        <View style={styles.right}>
          <Text style={[styles.amount, { color: accentColor }]}>
            {isIncome ? '+' : '-'}{formatCurrency(item.amount, currency)}
          </Text>
          <Switch
            value={item.active}
            onValueChange={(val) => update(item.id, { active: val })}
            trackColor={{ false: colors.border, true: colors.accent + '60' }}
            thumbColor={item.active ? colors.accent : colors.muted}
            style={styles.switch}
          />
        </View>
      </Pressable>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Recurring" subtitle="Automated transactions" />
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="repeat"
            title="No recurring transactions"
            body="Automate your salary, rent, and subscriptions."
          />
        }
      />
      <Pressable
        style={[styles.fab, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/recurring/add')}
      >
        <MaterialIcons name="add" size={28} color="#000" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  list: { padding: 16, gap: 10, paddingBottom: 100 },
  emptyContainer: { flex: 1 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, padding: 14 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  sub: { fontSize: 12, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 2 },
  amount: { fontSize: 14, fontWeight: '700' },
  switch: { transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] },
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
