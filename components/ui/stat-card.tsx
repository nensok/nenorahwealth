import { View, Text, StyleSheet } from 'react-native';
import { AmountDisplay } from './amount-display';
import { useColors } from '@/hooks/use-colors';

type Variant = 'income' | 'expense' | 'balance';

interface StatCardProps {
  label: string;
  amount: number;
  variant: Variant;
  currencySymbol?: string;
}

export function StatCard({ label, amount, variant, currencySymbol = '₦' }: StatCardProps) {
  const colors = useColors();

  const colorMap: Record<Variant, string> = {
    income: colors.positive,
    expense: colors.negative,
    balance: colors.accent,
  };

  const bgMap: Record<Variant, string> = {
    income: colors.positive + '18',
    expense: colors.negative + '18',
    balance: colors.accent + '18',
  };

  const amountColor = colorMap[variant];

  return (
    <View style={[styles.card, { backgroundColor: bgMap[variant], borderColor: colorMap[variant] + '30' }]}>
      <View style={[styles.dot, { backgroundColor: amountColor }]} />
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <AmountDisplay
        amount={amount}
        currencySymbol={currencySymbol}
        size="medium"
        color={amountColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 6,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 100,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8 },
});
