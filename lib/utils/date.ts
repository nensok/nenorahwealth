const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function getMonthName(month: number): string {
  return MONTH_NAMES[month - 1] ?? '';
}

export function getMonthShort(month: number): string {
  return MONTH_SHORT[month - 1] ?? '';
}

export function getCurrentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export function monthYearLabel(month: number, year: number): string {
  return `${getMonthName(month)} ${year}`;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

/** Returns the last 6 months including the given month, in chronological order */
export function getLast6Months(month: number, year: number): Array<{ month: number; year: number }> {
  const result: Array<{ month: number; year: number }> = [];
  let m = month;
  let y = year;
  for (let i = 0; i < 6; i++) {
    result.unshift({ month: m, year: y });
    m -= 1;
    if (m === 0) {
      m = 12;
      y -= 1;
    }
  }
  return result;
}
