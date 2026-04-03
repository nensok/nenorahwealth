import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G, Text as SvgText, Circle } from 'react-native-svg';
import { useColors } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/utils/currency';
import { EmptyState } from '@/components/ui/empty-state';
import type { CategorySpend } from '@/types';

interface SpendingPieProps {
  data: CategorySpend[];
  currencySymbol?: string;
}

const CX = 90;
const CY = 90;
const OUTER_R = 78;
const INNER_R = 54;
const GAP = 2.5; // degrees of gap between segments

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function segment(startDeg: number, endDeg: number): string | null {
  const s = startDeg + GAP / 2;
  const e = endDeg - GAP / 2;
  if (e - s < 0.5) return null;
  const large = e - s > 180 ? 1 : 0;
  const o1 = polar(CX, CY, OUTER_R, s);
  const o2 = polar(CX, CY, OUTER_R, e);
  const i1 = polar(CX, CY, INNER_R, e);
  const i2 = polar(CX, CY, INNER_R, s);
  const n = (v: number) => v.toFixed(3);
  return [
    `M ${n(o1.x)} ${n(o1.y)}`,
    `A ${OUTER_R} ${OUTER_R} 0 ${large} 1 ${n(o2.x)} ${n(o2.y)}`,
    `L ${n(i1.x)} ${n(i1.y)}`,
    `A ${INNER_R} ${INNER_R} 0 ${large} 0 ${n(i2.x)} ${n(i2.y)}`,
    'Z',
  ].join(' ');
}

function abbreviate(amount: number, symbol: string): string {
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${symbol}${(amount / 1_000).toFixed(1)}K`;
  return `${symbol}${amount.toFixed(0)}`;
}

export function SpendingPie({ data, currencySymbol = '₦' }: SpendingPieProps) {
  const colors = useColors();

  if (data.length === 0) {
    return (
      <EmptyState
        icon="pie-chart"
        title="No expenses yet"
        body="Add expenses to see your spending breakdown."
      />
    );
  }

  const total = data.reduce((s, d) => s + d.total, 0);

  let angle = 0;
  const segments = data.map((d) => {
    const sweep = (d.total / total) * 360;
    const path = segment(angle, angle + sweep);
    angle += sweep;
    return { ...d, path };
  });

  return (
    <View style={styles.wrapper}>
      {/* Donut */}
      <View style={styles.donutRow}>
        <Svg width={180} height={180}>
          {/* Background ring track */}
          <Circle
            cx={CX}
            cy={CY}
            r={(OUTER_R + INNER_R) / 2}
            fill="none"
            stroke="#FFFFFF08"
            strokeWidth={OUTER_R - INNER_R}
          />
          <G>
            {segments.map((seg, i) =>
              seg.path ? <Path key={i} d={seg.path} fill={seg.category.color} /> : null,
            )}
          </G>
          {/* Center label */}
          <SvgText
            x={CX}
            y={CY - 10}
            textAnchor="middle"
            fontSize="11"
            fill={colors.muted}
            letterSpacing="0.5"
          >
            TOTAL SPENT
          </SvgText>
          <SvgText
            x={CX}
            y={CY + 10}
            textAnchor="middle"
            fontSize="15"
            fill={colors.text}
          >
            {abbreviate(total, currencySymbol)}
          </SvgText>
        </Svg>

        {/* Top categories stacked beside donut */}
        <View style={styles.topList}>
          {segments.slice(0, 4).map((seg) => (
            <View key={seg.category.id} style={styles.topItem}>
              <View style={[styles.topDot, { backgroundColor: seg.category.color }]} />
              <View style={styles.topInfo}>
                <Text style={[styles.topName, { color: colors.text }]} numberOfLines={1}>
                  {seg.category.name}
                </Text>
                <Text style={[styles.topPct, { color: colors.muted }]}>
                  {seg.percentage.toFixed(0)}%
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Full legend with bars */}
      <View style={[styles.legendBox, { borderTopColor: colors.border }]}>
        {segments.map((seg) => (
          <View key={seg.category.id} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: seg.category.color }]} />
            <Text style={[styles.legendName, { color: colors.text }]} numberOfLines={1}>
              {seg.category.name}
            </Text>
            {/* Progress bar */}
            <View style={[styles.barTrack, { backgroundColor: colors.surfaceElevated }]}>
              <View
                style={[
                  styles.barFill,
                  { width: `${seg.percentage}%` as `${number}%`, backgroundColor: seg.category.color + 'CC' },
                ]}
              />
            </View>
            <Text style={[styles.legendAmount, { color: colors.muted }]}>
              {formatCurrency(seg.total, currencySymbol)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 20 },
  donutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topList: { flex: 1, gap: 10 },
  topItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  topDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  topInfo: { flex: 1 },
  topName: { fontSize: 13, fontWeight: '500' },
  topPct: { fontSize: 11, marginTop: 1 },
  legendBox: { borderTopWidth: 1, paddingTop: 16, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  legendName: { width: 80, fontSize: 12 },
  barTrack: { flex: 1, height: 4, borderRadius: 2, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 2 },
  legendAmount: { fontSize: 11, width: 72, textAlign: 'right' },
});
