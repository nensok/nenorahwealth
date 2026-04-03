import { Text, StyleSheet } from 'react-native';
import { formatCurrency } from '@/lib/utils/currency';
import { useColors } from '@/hooks/use-colors';

interface AmountDisplayProps {
  amount: number;
  currencySymbol?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  positive?: boolean;
}

export function AmountDisplay({
  amount,
  currencySymbol = '₦',
  size = 'large',
  color,
  positive,
}: AmountDisplayProps) {
  const colors = useColors();

  const resolvedColor =
    color ??
    (positive === true
      ? colors.positive
      : positive === false
      ? colors.negative
      : colors.text);

  const fontSize = size === 'large' ? 36 : size === 'medium' ? 24 : 16;

  return (
    <Text style={[styles.text, { color: resolvedColor, fontSize, lineHeight: fontSize * 1.2 }]}>
      {formatCurrency(amount, currencySymbol)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontWeight: '800', letterSpacing: -0.5 },
});
