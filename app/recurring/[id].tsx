import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/use-colors';
import { useRecurringStore } from '@/stores/recurring-store';
import { useAppStore } from '@/stores/app-store';
import { parseCurrencyInput } from '@/lib/utils/currency';
import type { RecurringTransaction } from '@/types';

const FREQUENCIES = ['weekly', 'monthly', 'yearly'] as const;
const FREQ_LABEL: Record<string, string> = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

export default function EditRecurringScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [record, setRecord] = useState<RecurringTransaction | null>(null);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');
  const [saving, setSaving] = useState(false);

  const getById = useRecurringStore((s) => s.getById);
  const update = useRecurringStore((s) => s.update);
  const remove = useRecurringStore((s) => s.remove);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  useEffect(() => {
    async function load() {
      const item = await getById(parseInt(id));
      if (item) {
        setRecord(item);
        setAmount(String(item.amount));
        setTitle(item.title);
        setFrequency(item.frequency);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    const parsed = parseCurrencyInput(amount);
    if (!parsed || !title.trim()) return;
    setSaving(true);
    await update(parseInt(id), { amount: parsed, title: title.trim(), frequency });
    setSaving(false);
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Recurring', 'Remove this recurring transaction?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(parseInt(id));
          router.back();
        },
      },
    ]);
  }

  if (!record) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const isIncome = record.type === 'income';
  const accent = isIncome ? colors.positive : colors.negative;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={[styles.badge, { backgroundColor: accent + '20' }]}>
            <Text style={[styles.badgeText, { color: accent }]}>
              {isIncome ? 'Income' : 'Expense'} · {FREQ_LABEL[record.frequency]}
            </Text>
          </View>

          <Text style={[styles.heading, { color: colors.text }]}>Edit Recurring</Text>

          <Input
            label={isIncome ? 'Source / Title' : 'Description'}
            value={title}
            onChangeText={setTitle}
          />

          <Input
            label={`Amount (${currency})`}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

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

          <Text style={[styles.nextDue, { color: colors.muted }]}>Next due: {record.nextDueDate}</Text>

          <Button label={saving ? 'Saving…' : 'Save Changes'} onPress={handleSave} loading={saving} />
          <Button label="Delete" variant="danger" onPress={handleDelete} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 24, gap: 20, paddingBottom: 60 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  badgeText: { fontSize: 13, fontWeight: '700' },
  heading: { fontSize: 24, fontWeight: '800' },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  freqRow: { flexDirection: 'row', gap: 8 },
  freqBtn: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  freqText: { fontSize: 13, fontWeight: '600' },
  nextDue: { fontSize: 13 },
});
