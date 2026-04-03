import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useColors } from '@/hooks/use-colors';
import { useBudgetStore } from '@/stores/budget-store';
import { useCategoryStore } from '@/stores/category-store';
import { useAppStore } from '@/stores/app-store';
import { getCurrentMonthYear } from '@/lib/utils/date';
import { parseCurrencyInput } from '@/lib/utils/currency';

export default function SetBudgetScreen() {
  const colors = useColors();
  const { categoryId: categoryIdParam } = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = parseInt(categoryIdParam);
  const { month, year } = getCurrentMonthYear();

  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const upsert = useBudgetStore((s) => s.upsert);
  const remove = useBudgetStore((s) => s.remove);
  const budgets = useBudgetStore((s) => s.budgets);
  const getById = useCategoryStore((s) => s.getById);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  const existing = budgets.find((b) => b.categoryId === categoryId && b.month === month && b.year === year);
  const category = getById(categoryId);
  const monthLabel = new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });

  useEffect(() => {
    if (existing) setAmount(String(existing.amount));
  }, [existing]);

  async function handleSave() {
    const parsed = parseCurrencyInput(amount);
    if (!parsed || parsed <= 0) return;
    setSaving(true);
    await upsert(categoryId, parsed, month, year);
    setSaving(false);
    router.back();
  }

  function handleDelete() {
    if (!existing) return;
    Alert.alert('Remove Budget', `Remove the budget for ${category?.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await remove(existing.id);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Category badge */}
          <View style={[styles.badge, { backgroundColor: (category?.color ?? colors.accent) + '20' }]}>
            <View style={[styles.dot, { backgroundColor: category?.color ?? colors.accent }]} />
            <Text style={[styles.catName, { color: category?.color ?? colors.accent }]}>
              {category?.name ?? 'Category'}
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.text }]}>
            {existing ? 'Edit Budget' : 'Set Budget'}
          </Text>
          <Text style={[styles.sub, { color: colors.muted }]}>{monthLabel}</Text>

          <Input
            label={`Monthly limit (${currency})`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
            autoFocus
          />

          <Button
            label={saving ? 'Saving…' : 'Save Budget'}
            onPress={handleSave}
            loading={saving}
            style={styles.btn}
          />

          {existing && (
            <Button
              label="Remove Budget"
              variant="danger"
              onPress={handleDelete}
              style={styles.btn}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: 24, gap: 16 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 13, fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: -8 },
  btn: { marginTop: 4 },
});
