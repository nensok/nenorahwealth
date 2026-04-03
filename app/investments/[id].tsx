import { useEffect, useState } from 'react';
import {
  ScrollView, View, Text, Alert, StyleSheet, ActivityIndicator,
  Pressable, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { InvestmentForm } from '@/components/forms/investment-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useColors } from '@/hooks/use-colors';
import { useInvestmentStore } from '@/stores/investment-store';
import { useAppStore } from '@/stores/app-store';
import { getDb } from '@/lib/db/client';
import { getInvestmentById } from '@/lib/db/queries/investments';
import { formatCurrency, parseCurrencyInput } from '@/lib/utils/currency';
import type { Investment, InvestmentFormData, InvestmentTransaction } from '@/types';

function formatDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function EditInvestmentScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const investmentId = parseInt(id);
  const [record, setRecord] = useState<Investment | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);

  // Transaction form state
  const [txType, setTxType] = useState<'buy' | 'sell'>('buy');
  const [txQty, setTxQty] = useState('');
  const [txPrice, setTxPrice] = useState('');
  const [txDate, setTxDate] = useState(new Date());
  const [txNotes, setTxNotes] = useState('');
  const [txSaving, setTxSaving] = useState(false);

  const update = useInvestmentStore((s) => s.update);
  const remove = useInvestmentStore((s) => s.remove);
  const loadTransactions = useInvestmentStore((s) => s.loadTransactions);
  const addTransaction = useInvestmentStore((s) => s.addTransaction);
  const removeTransaction = useInvestmentStore((s) => s.removeTransaction);
  const transactions = useInvestmentStore((s) => s.transactions);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  const txList: InvestmentTransaction[] = transactions[investmentId] ?? [];

  useEffect(() => {
    async function load() {
      const db = await getDb();
      const item = await getInvestmentById(db, investmentId);
      setRecord(item);
    }
    load();
    loadTransactions(investmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investmentId]);

  async function handleSubmit(data: InvestmentFormData) {
    await update(investmentId, {
      stockName: data.stockName,
      ticker: data.ticker,
      quantity: parseFloat(data.quantity),
      buyPrice: parseFloat(data.buyPrice),
      currentPrice: parseFloat(data.currentPrice),
      notes: data.notes,
    });
    router.back();
  }

  function handleDelete() {
    Alert.alert('Delete Position', 'Remove this investment position?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await remove(investmentId);
          router.back();
        },
      },
    ]);
  }

  async function handleAddTransaction() {
    const qty = parseFloat(txQty);
    const price = parseCurrencyInput(txPrice);
    if (!qty || !price) return;
    setTxSaving(true);
    await addTransaction({
      investmentId,
      type: txType,
      quantity: qty,
      price,
      date: formatDate(txDate),
      notes: txNotes.trim() || undefined,
    });
    setTxSaving(false);
    setShowTxModal(false);
    setTxQty('');
    setTxPrice('');
    setTxNotes('');
    setTxDate(new Date());
  }

  function handleDeleteTransaction(txId: number) {
    Alert.alert('Delete Transaction', 'Remove this transaction?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTransaction(txId, investmentId) },
    ]);
  }

  if (!record) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const CARD_GOLD = '#F0C040';

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <InvestmentForm
          defaultValues={{
            stockName: record.stockName,
            ticker: record.ticker,
            quantity: String(record.quantity),
            buyPrice: String(record.buyPrice),
            currentPrice: String(record.currentPrice),
            notes: record.notes,
          }}
          onSubmit={handleSubmit}
          submitLabel="Save Changes"
          currencySymbol={currency}
        />

        {/* Transaction History */}
        <View style={[styles.txSection, { borderTopColor: colors.border }]}>
          <View style={styles.txHeader}>
            <Text style={[styles.txTitle, { color: colors.text }]}>Transaction History</Text>
            <Pressable
              onPress={() => setShowTxModal(true)}
              style={[styles.addTxBtn, { backgroundColor: CARD_GOLD + '20', borderColor: CARD_GOLD + '60' }]}
            >
              <MaterialIcons name="add" size={16} color={CARD_GOLD} />
              <Text style={[styles.addTxText, { color: CARD_GOLD }]}>Log Trade</Text>
            </Pressable>
          </View>

          {txList.length === 0 ? (
            <Text style={[styles.txEmpty, { color: colors.muted }]}>No transactions logged yet.</Text>
          ) : (
            txList.map((tx) => {
              const isBuy = tx.type === 'buy';
              const color = isBuy ? colors.positive : colors.negative;
              return (
                <Pressable
                  key={tx.id}
                  onLongPress={() => handleDeleteTransaction(tx.id)}
                  style={[styles.txRow, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.txIcon, { backgroundColor: color + '20' }]}>
                    <MaterialIcons name={isBuy ? 'arrow-downward' : 'arrow-upward'} size={14} color={color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txType, { color: colors.text }]}>
                      {isBuy ? 'Buy' : 'Sell'} · {tx.quantity} units @ {formatCurrency(tx.price, currency)}
                    </Text>
                    <Text style={[styles.txDate, { color: colors.muted }]}>{tx.date}{tx.notes ? ` · ${tx.notes}` : ''}</Text>
                  </View>
                  <Text style={[styles.txTotal, { color }]}>
                    {isBuy ? '-' : '+'}{formatCurrency(tx.quantity * tx.price, currency)}
                  </Text>
                </Pressable>
              );
            })
          )}
        </View>

        <Button label="Delete Position" variant="danger" onPress={handleDelete} style={styles.deleteBtn} />
      </ScrollView>

      {/* Add Transaction Modal */}
      <Modal visible={showTxModal} transparent animationType="slide" onRequestClose={() => setShowTxModal(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable style={styles.modalBackdrop} onPress={() => setShowTxModal(false)} />
          <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.sheetTitle, { color: colors.text }]}>Log Trade</Text>

            {/* Buy / Sell toggle */}
            <View style={[styles.toggle, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {(['buy', 'sell'] as const).map((t) => {
                const active = txType === t;
                const c = t === 'buy' ? colors.positive : colors.negative;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setTxType(t)}
                    style={[styles.toggleBtn, active && { backgroundColor: c + '20', borderColor: c, borderWidth: 1 }]}
                  >
                    <Text style={[styles.toggleText, { color: active ? c : colors.muted }]}>
                      {t === 'buy' ? 'Buy' : 'Sell'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Input label="Quantity" value={txQty} onChangeText={setTxQty} keyboardType="decimal-pad" placeholder="0" />
            <Input label={`Price per unit (${currency})`} value={txPrice} onChangeText={setTxPrice} keyboardType="decimal-pad" placeholder="0.00" />
            <Input label="Notes (optional)" value={txNotes} onChangeText={setTxNotes} placeholder="e.g. market order" />

            <View style={[styles.dateRow, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.dateLabel, { color: colors.muted }]}>Date</Text>
              <DateTimePicker
                value={txDate}
                mode="date"
                display="default"
                onChange={(_, d) => { if (d) setTxDate(d); }}
                maximumDate={new Date()}
                themeVariant="dark"
              />
            </View>

            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => setShowTxModal(false)}
                style={[styles.sheetBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              >
                <Text style={[styles.sheetBtnText, { color: colors.muted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddTransaction}
                disabled={txSaving || !txQty || !txPrice}
                style={[styles.sheetBtn, { backgroundColor: CARD_GOLD, opacity: txSaving ? 0.6 : 1 }]}
              >
                <Text style={[styles.sheetBtnText, { color: '#000' }]}>{txSaving ? 'Saving…' : 'Log Trade'}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  txSection: { borderTopWidth: 1, paddingTop: 16, gap: 10 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  txTitle: { fontSize: 16, fontWeight: '700' },
  addTxBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1 },
  addTxText: { fontSize: 12, fontWeight: '700' },
  txEmpty: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  txIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txType: { fontSize: 13, fontWeight: '600' },
  txDate: { fontSize: 11, marginTop: 2 },
  txTotal: { fontSize: 13, fontWeight: '700' },
  deleteBtn: { marginTop: 8 },
  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, padding: 24, gap: 14 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: '800' },
  toggle: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10 },
  toggleText: { fontSize: 14, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 4 },
  dateLabel: { fontSize: 13, fontWeight: '600' },
  sheetActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  sheetBtn: { flex: 1, paddingVertical: 15, borderRadius: 100, alignItems: 'center', borderWidth: 1 },
  sheetBtnText: { fontSize: 15, fontWeight: '700' },
});
