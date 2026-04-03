import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '@/hooks/use-colors';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, accentColor, right }: ScreenHeaderProps) {
  const colors = useColors();
  const accent = accentColor ?? colors.accent;

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.accentBar, { backgroundColor: accent }]} />
        <View>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
          ) : null}
        </View>
      </View>
      {right ? <View>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 14,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accentBar: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
});
