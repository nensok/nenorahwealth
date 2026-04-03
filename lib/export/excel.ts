import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import XLSX from 'xlsx';
import { getDb } from '@/lib/db/client';
import { getIncomeByMonth } from '@/lib/db/queries/income';
import { getExpensesByMonth } from '@/lib/db/queries/expenses';
import { getAllCategories } from '@/lib/db/queries/categories';
import { calcBalance } from '@/lib/utils/calculations';
import { monthYearLabel } from '@/lib/utils/date';

export async function exportMonthlyExcel(
  month: number,
  year: number,
  currencySymbol: string,
): Promise<void> {
  const db = await getDb();
  const [incomeRecords, expenseRecords, categories] = await Promise.all([
    getIncomeByMonth(db, month, year),
    getExpensesByMonth(db, month, year),
    getAllCategories(db),
  ]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  // Income sheet
  const incomeRows = [
    ['Source', `Amount (${currencySymbol})`, 'Notes'],
    ...incomeRecords.map((r) => [r.source, r.amount, r.notes ?? '']),
    [],
    ['Total', incomeRecords.reduce((s, r) => s + r.amount, 0)],
  ];

  // Expenses sheet
  const expenseRows = [
    ['Description', 'Category', `Amount (${currencySymbol})`, 'Date'],
    ...expenseRecords.map((r) => [
      r.description,
      catMap.get(r.categoryId) ?? 'Unknown',
      r.amount,
      r.date,
    ]),
    [],
    ['Total', '', expenseRecords.reduce((s, r) => s + r.amount, 0)],
  ];

  // Summary sheet
  const totalIncome = incomeRecords.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((s, r) => s + r.amount, 0);
  const summaryRows = [
    ['Summary', monthYearLabel(month, year)],
    [],
    ['Total Income', totalIncome],
    ['Total Expenses', totalExpenses],
    ['Balance', calcBalance(totalIncome, totalExpenses)],
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(incomeRows), 'Income');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(expenseRows), 'Expenses');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

  // xlsx's 'base64' output type uses Buffer (Node.js-only) — unavailable in React Native.
  // Use 'array' (Uint8Array) instead and convert to base64 manually via btoa().
  const wbArray: Uint8Array = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  let binary = '';
  for (let i = 0; i < wbArray.length; i++) {
    binary += String.fromCharCode(wbArray[i]);
  }
  const wbOut = btoa(binary);

  const fileName = `NenorahWealth_${year}_${String(month).padStart(2, '0')}.xlsx`;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(filePath, wbOut, {
    encoding: 'base64',
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: `Export ${monthYearLabel(month, year)}`,
    });
  }
}
