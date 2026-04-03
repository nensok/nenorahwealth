import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getDb } from '@/lib/db/client';
import { getIncomeByMonth } from '@/lib/db/queries/income';
import { getExpensesByMonth } from '@/lib/db/queries/expenses';
import { getAllCategories } from '@/lib/db/queries/categories';
import { calcBalance } from '@/lib/utils/calculations';
import { monthYearLabel } from '@/lib/utils/date';

function fmt(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function exportMonthlyPdf(
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

  const catMap = new Map(categories.map((c) => [c.id, c]));
  const totalIncome = incomeRecords.reduce((s, r) => s + r.amount, 0);
  const totalExpenses = expenseRecords.reduce((s, r) => s + r.amount, 0);
  const balance = calcBalance(totalIncome, totalExpenses);
  const label = monthYearLabel(month, year);

  // Build category spend summary
  const catSpend = new Map<number, number>();
  for (const e of expenseRecords) {
    catSpend.set(e.categoryId, (catSpend.get(e.categoryId) ?? 0) + e.amount);
  }
  const catRows = [...catSpend.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id, total]) => {
      const cat = catMap.get(id);
      const pct = totalExpenses > 0 ? ((total / totalExpenses) * 100).toFixed(1) : '0.0';
      return `<tr><td>${cat?.name ?? 'Unknown'}</td><td class="num">${fmt(total, currencySymbol)}</td><td class="num">${pct}%</td></tr>`;
    })
    .join('');

  const incomeRows = incomeRecords
    .map((r) => `<tr><td>${r.source}</td><td class="num">${fmt(r.amount, currencySymbol)}</td><td>${r.notes ?? ''}</td></tr>`)
    .join('');

  const expenseRows = expenseRecords
    .map((r) => {
      const cat = catMap.get(r.categoryId);
      return `<tr><td>${r.description}</td><td>${cat?.name ?? ''}</td><td class="num">${fmt(r.amount, currencySymbol)}</td><td>${r.date}</td></tr>`;
    })
    .join('');

  const balanceColor = balance >= 0 ? '#16A34A' : '#DC2626';

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, 'Helvetica Neue', sans-serif; font-size: 13px; color: #1a1a1a; padding: 32px; }
  h1 { font-size: 26px; font-weight: 800; color: #0a0a0a; margin-bottom: 4px; }
  .sub { color: #6B7280; font-size: 13px; margin-bottom: 28px; }
  .summary { display: flex; gap: 16px; margin-bottom: 32px; }
  .stat { flex: 1; border-radius: 12px; padding: 16px; border: 1px solid #E5E7EB; }
  .stat-label { font-size: 11px; font-weight: 600; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
  .stat-value { font-size: 20px; font-weight: 800; }
  .green { color: #16A34A; background: #F0FDF4; }
  .red { color: #DC2626; background: #FEF2F2; }
  .balance-val { color: ${balanceColor}; }
  h2 { font-size: 15px; font-weight: 700; margin: 24px 0 10px; padding-bottom: 6px; border-bottom: 2px solid #F3F4F6; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 11px; font-weight: 700; color: #6B7280; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 10px; background: #F9FAFB; }
  td { padding: 8px 10px; border-bottom: 1px solid #F3F4F6; vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  tr:last-child td { border-bottom: none; }
  .total-row td { font-weight: 700; background: #F9FAFB; }
  .footer { margin-top: 40px; color: #9CA3AF; font-size: 11px; text-align: center; }
</style>
</head>
<body>
  <h1>NenorahWealth</h1>
  <p class="sub">Monthly Report — ${label}</p>

  <div class="summary">
    <div class="stat green">
      <div class="stat-label">Total Income</div>
      <div class="stat-value">${fmt(totalIncome, currencySymbol)}</div>
    </div>
    <div class="stat red">
      <div class="stat-label">Total Expenses</div>
      <div class="stat-value">${fmt(totalExpenses, currencySymbol)}</div>
    </div>
    <div class="stat" style="border-color:${balanceColor}40; background:${balanceColor}08">
      <div class="stat-label">Balance</div>
      <div class="stat-value balance-val">${fmt(balance, currencySymbol)}</div>
    </div>
  </div>

  ${catRows ? `
  <h2>Spending by Category</h2>
  <table>
    <tr><th>Category</th><th class="num">Amount</th><th class="num">%</th></tr>
    ${catRows}
    <tr class="total-row"><td>Total</td><td class="num">${fmt(totalExpenses, currencySymbol)}</td><td></td></tr>
  </table>` : ''}

  ${incomeRows ? `
  <h2>Income</h2>
  <table>
    <tr><th>Source</th><th class="num">Amount</th><th>Notes</th></tr>
    ${incomeRows}
    <tr class="total-row"><td>Total</td><td class="num">${fmt(totalIncome, currencySymbol)}</td><td></td></tr>
  </table>` : ''}

  ${expenseRows ? `
  <h2>Expenses</h2>
  <table>
    <tr><th>Description</th><th>Category</th><th class="num">Amount</th><th>Date</th></tr>
    ${expenseRows}
    <tr class="total-row"><td>Total</td><td></td><td class="num">${fmt(totalExpenses, currencySymbol)}</td><td></td></tr>
  </table>` : ''}

  <p class="footer">Generated by NenorahWealth · ${new Date().toLocaleDateString()}</p>
</body>
</html>`;

  const { uri } = await Print.printToFileAsync({ html, base64: false });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Report ${label}`,
      UTI: 'com.adobe.pdf',
    });
  }
}
