import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/use-colors';

const PIN_LENGTH = 4;

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', '⌫'],
];

interface PinPadProps {
  onComplete: (pin: string) => void;
  isError?: boolean;
  title?: string;
  subtitle?: string;
}

export function PinPad({ onComplete, isError = false, title, subtitle }: PinPadProps) {
  const [pin, setPin] = useState('');
  const colors = useColors();

  function handleKey(key: string) {
    if (key === '') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === '⌫') {
      setPin((p) => p.slice(0, -1));
      return;
    }

    const next = pin + key;
    setPin(next);

    if (next.length === PIN_LENGTH) {
      setTimeout(() => {
        onComplete(next);
        setPin('');
      }, 100);
    }
  }

  return (
    <View style={styles.container}>
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}

      {/* Dots */}
      <View style={styles.dots}>
        {Array.from({ length: PIN_LENGTH }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < pin.length
                ? [styles.dotFilled, { backgroundColor: isError ? colors.negative : colors.accent }]
                : [styles.dotEmpty, { borderColor: colors.border }],
            ]}
          />
        ))}
      </View>

      {/* Keypad */}
      <View style={styles.grid}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.row}>
            {row.map((key, ki) => (
              <Pressable
                key={ki}
                onPress={() => handleKey(key)}
                style={({ pressed }) => [
                  styles.key,
                  key === '' && styles.keyInvisible,
                  key !== '' && {
                    backgroundColor: pressed ? colors.surfaceElevated : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                disabled={key === ''}
              >
                {key === '⌫' ? (
                  <MaterialIcons name="backspace" size={22} color={colors.text} />
                ) : (
                  <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 36 },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', marginTop: -20 },
  dots: { flexDirection: 'row', gap: 18 },
  dot: { width: 16, height: 16, borderRadius: 8 },
  dotFilled: {},
  dotEmpty: { borderWidth: 2 },
  grid: { width: '100%', maxWidth: 300, gap: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  key: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 76,
    borderWidth: 1,
  },
  keyInvisible: { backgroundColor: 'transparent', borderWidth: 0 },
  keyText: { fontSize: 26, fontWeight: '500' },
});
