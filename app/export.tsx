import { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MonthPicker } from '@/components/ui/month-picker';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useColors } from '@/hooks/use-colors';
import { useAppStore } from '@/stores/app-store';
import { getCurrentMonthYear } from '@/lib/utils/date';
import { exportMonthlyExcel } from '@/lib/export/excel';
import { exportMonthlyPdf } from '@/lib/export/pdf';

export default function ExportScreen() {
  const colors = useColors();
  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const [month, setMonth] = useState(currentMonth);
  const [year, setYear] = useState(currentYear);
  const [excelLoading, setExcelLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const currency = useAppStore((s) => s.settings?.currencySymbol ?? '₦');

  async function handleExportExcel() {
    setExcelLoading(true);
    try {
      await exportMonthlyExcel(month, year, currency);
    } catch (e) {
      Alert.alert('Export Failed', String(e));
    } finally {
      setExcelLoading(false);
    }
  }

  async function handleExportPdf() {
    setPdfLoading(true);
    try {
      await exportMonthlyPdf(month, year, currency);
    } catch (e) {
      Alert.alert('Export Failed', String(e));
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        <Card>
          <Text style={[styles.label, { color: colors.text }]}>Select Month to Export</Text>
          <MonthPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        </Card>

        <Card>
          <Text style={[styles.infoTitle, { color: colors.text }]}>What is included</Text>
          <Text style={[styles.info, { color: colors.muted }]}>
            • Income records for the selected month{'\n'}
            • Expense records with categories{'\n'}
            • Summary: total income, expenses & balance{'\n'}
            • Spending breakdown by category (PDF)
          </Text>
        </Card>

        <Button
          label="Export to Excel (.xlsx)"
          onPress={handleExportExcel}
          loading={excelLoading}
        />

        <Button
          label="Export to PDF"
          variant="secondary"
          onPress={handleExportPdf}
          loading={pdfLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 20, gap: 16 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  infoTitle: { fontSize: 15, fontWeight: '600', marginBottom: 8 },
  info: { fontSize: 14, lineHeight: 22 },
});
