import { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withTiming, withSpring } from 'react-native-reanimated';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/utils/currency';

interface ListItemProps {
  title: string;
  subtitle?: string;
  amount?: number;
  amountColor?: string;
  currencySymbol?: string;
  accentColor?: string;
  onPress?: () => void;
  rightLabel?: string;
  index?: number;
}

export function ListItem({
  title,
  subtitle,
  amount,
  amountColor,
  currencySymbol = '₦',
  accentColor,
  onPress,
  rightLabel,
  index = 0,
}: ListItemProps) {
  const colors = useColors();

  const opacity = useSharedValue(0);
  const tx = useSharedValue(24);

  useEffect(() => {
    const delay = index * 55;
    opacity.value = withDelay(delay, withTiming(1, { duration: 350 }));
    tx.value = withDelay(delay, withSpring(0, { damping: 20, stiffness: 160 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: tx.value }],
  }));

  return (
    <Animated.View style={animStyle}>
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {accentColor ? (
        <View style={[styles.accentBar, { backgroundColor: accentColor }]} />
      ) : null}
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.muted }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        {amount !== undefined ? (
          <Text style={[styles.amount, { color: amountColor ?? colors.text }]}>
            {formatCurrency(amount, currencySymbol)}
          </Text>
        ) : null}
        {rightLabel ? (
          <Text style={[styles.rightLabel, { color: colors.muted }]}>{rightLabel}</Text>
        ) : null}
      </View>
    </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    gap: 12,
  },
  accentBar: { width: 4, height: 36, borderRadius: 2 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 13, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontWeight: '700' },
  rightLabel: { fontSize: 11, marginTop: 2 },
});
