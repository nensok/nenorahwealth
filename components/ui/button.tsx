import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from 'react-native';
import { useColors } from '@/hooks/use-colors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const colors = useColors();

  const bgMap: Record<Variant, string> = {
    primary: colors.accent,
    secondary: colors.surfaceElevated,
    ghost: 'transparent',
    danger: colors.negative,
  };

  const textMap: Record<Variant, string> = {
    primary: '#000000',
    secondary: colors.text,
    ghost: colors.accent,
    danger: '#FFFFFF',
  };

  const borderMap: Record<Variant, string | undefined> = {
    primary: undefined,
    secondary: colors.border,
    ghost: undefined,
    danger: undefined,
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgMap[variant],
          opacity: pressed || disabled ? 0.6 : 1,
          borderWidth: borderMap[variant] ? 1 : 0,
          borderColor: borderMap[variant],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textMap[variant]} />
      ) : (
        <Text style={[styles.label, { color: textMap[variant] }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 100,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
