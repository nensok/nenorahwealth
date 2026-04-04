import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Pressable,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { useColors } from '@/hooks/use-colors';
import { useRecurringStore } from '@/stores/recurring-store';
import { useCategoryStore } from '@/stores/category-store';
import { useAppStore } from '@/stores/app-store';
import { parseCurrencyInput } from '@/lib/utils/currency';

const FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const;
const FREQ_LABEL: Record<string, string> = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

export default function AddRecurringScreen() {
  const colors = useColors();
  const add = useRecurringStore((s) => s.add);
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.load);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0);
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [startDate, setStartDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (categories.length > 0 && categoryId === 0) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  function formatDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  async function handleSave() {
    const parsed = parseCurrencyInput(amount);
    if (!parsed || !title.trim()) return;
    setSaving(true);
    await add({
      type,
      amount: parsed,
      title: title.trim(),
      categoryId: type === 'expense' ? categoryId : undefined,
      frequency,
      nextDueDate: formatDate(startDate),
      active: true,
    });
    setSaving(false);
    router.back();
  }

  const accentIncome = colors.positive;
  const accentExpense = colors.negative;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { color: colors.text }]}>New Recurring</Text>

          {/* Type toggle */}
          <View style={[styles.toggle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            {(['expense', 'income'] as const).map((t) => {
              const active = type === t;
              const accent = t === 'income' ? accentIncome : accentExpense;
              return (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.toggleBtn, active && { backgroundColor: accent + '20', borderColor: accent, borderWidth: 1 }]}
                >
                  <MaterialIcons name={t === 'income' ? 'arrow-downward' : 'arrow-upward'} size={16} color={active ? accent : colors.muted} />
                  <Text style={[styles.toggleText, { color: active ? accent : colors.muted }]}>
                    {t === 'income' ? 'Income' : 'Expense'}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Input
            label={type === 'income' ? 'Source / Title' : 'Description'}
            value={title}
            onChangeText={setTitle}
            placeholder={type === 'income' ? 'e.g. Salary' : 'e.g. Rent'}
          />

          <Input
            label={`Amount (${currency})`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />

          {/* Category (expense only) */}
          {type === 'expense' && (
            <View>
              <Text style={[styles.label, { color: colors.muted }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
                {categories.map((cat) => {
                  const active = categoryId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      style={[styles.catChip, { borderColor: active ? cat.color : colors.border, backgroundColor: active ? cat.color + '20' : colors.surfaceElevated }]}
                    >
                      <Text style={[styles.catChipText, { color: active ? cat.color : colors.muted }]}>{cat.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Frequency */}
          <View>
            <Text style={[styles.label, { color: colors.muted }]}>Frequency</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => {
                const active = frequency === f;
                return (
                  <Pressable
                    key={f}
                    onPress={() => setFrequency(f)}
                    style={[styles.freqBtn, { borderColor: active ? colors.accent : colors.border, backgroundColor: active ? colors.accent + '15' : colors.surfaceElevated }]}
                  >
                    <Text style={[styles.freqText, { color: active ? colors.accent : colors.muted }]}>{FREQ_LABEL[f]}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Start date */}
          <DateField
            label="First Due Date"
            value={startDate}
            onChange={setStartDate}
            minimumDate={new Date()}
          />

          <Button label={saving ? 'Saving…' : 'Create Recurring'} onPress={handleSave} loading={saving} style={styles.btn} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { padding: 24, gap: 20, paddingBottom: 60 },
  heading: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  toggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  catRow: { gap: 8, paddingVertical: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  catChipText: { fontSize: 13, fontWeight: '600' },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  freqText: { fontSize: 13, fontWeight: '600' },
  btn: { marginTop: 4 },
});
