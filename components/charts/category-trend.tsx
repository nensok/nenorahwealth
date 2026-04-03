import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useColors } from '@/hooks/use-colors';
import { getMonthShort } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils/currency';
import type { Category, CategoryTrendPoint } from '@/types';

interface CategoryTrendProps {
  data: CategoryTrendPoint[];
  categories: Category[];
  months: { month: number; year: number }[];
  currencySymbol: string;
}

const TENSION = 0.3;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;
const PAD_H = 4;
const CHART_H = 160;

// Fixed palette for up to 5 category lines
const LINE_COLORS = ['#60A5FA', '#F472B6', '#34D399', '#FBBF24', '#A78BFA'];

function mapPoints(values: number[], width: number, max: number) {
  const n = values.length;
  const innerW = width - PAD_H * 2;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
  return values.map((v, i) => ({
    x: PAD_H + (i / Math.max(n - 1, 1)) * innerW,
    y: PAD_TOP + (1 - (max > 0 ? v / max : 0)) * innerH,
  }));
}

function linePath(pts: { x: number; y: number }[]) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 2] ?? pts[0];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[i + 1] ?? pts[pts.length - 1];
    const cp1x = p1.x + (p2.x - p0.x) * TENSION;
    const cp1y = p1.y + (p2.y - p0.y) * TENSION;
    const cp2x = p2.x - (p3.x - p1.x) * TENSION;
    const cp2y = p2.y - (p3.y - p1.y) * TENSION;
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)} ${cp2x.toFixed(2)} ${cp2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }
  return d;
}

export function CategoryTrend({ data, categories, months, currencySymbol }: CategoryTrendProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useColors();
  const chartWidth = screenWidth - 72;

  if (data.length === 0) return null;

  // Find top 5 categories by total spend across all months
  const catTotals = new Map<number, number>();
  for (const pt of data) {
    catTotals.set(pt.categoryId, (catTotals.get(pt.categoryId) ?? 0) + pt.total);
  }
  const topCatIds = [...catTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  if (topCatIds.length === 0) return null;

  // Build per-category monthly totals
  const seriesMap = new Map<number, number[]>();
  for (const catId of topCatIds) {
    seriesMap.set(
      catId,
      months.map(({ month, year }) => {
        const pt = data.find((d) => d.categoryId === catId && d.month === month && d.year === year);
        return pt?.total ?? 0;
      }),
    );
  }

  const maxVal = Math.max(...[...seriesMap.values()].flat(), 1);
  const bottomY = CHART_H - PAD_BOTTOM;
  const gridYs = [0.25, 0.5, 0.75].map((f) => PAD_TOP + (1 - f) * (CHART_H - PAD_TOP - PAD_BOTTOM));

  return (
    <View>
      {/* Legend */}
      <View style={styles.legend}>
        {topCatIds.map((catId, i) => {
          const cat = categories.find((c) => c.id === catId);
          const total = catTotals.get(catId) ?? 0;
          return (
            <View key={catId} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: LINE_COLORS[i] }]} />
              <Text style={[styles.legendText, { color: colors.muted }]} numberOfLines={1}>
                {cat?.name ?? 'Other'} · {formatCurrency(total, currencySymbol)}
              </Text>
            </View>
          );
        })}
      </View>

      <Svg width={chartWidth} height={CHART_H}>
        <Defs>
          {topCatIds.map((catId, i) => (
            <LinearGradient key={catId} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={LINE_COLORS[i]} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={LINE_COLORS[i]} stopOpacity="0" />
            </LinearGradient>
          ))}
        </Defs>

        {gridYs.map((y, i) => (
          <Line key={i} x1={PAD_H} y1={y} x2={chartWidth - PAD_H} y2={y} stroke="#FFFFFF0A" strokeWidth="1" />
        ))}
        <Line x1={PAD_H} y1={bottomY} x2={chartWidth - PAD_H} y2={bottomY} stroke="#FFFFFF14" strokeWidth="1" />

        {topCatIds.map((catId, i) => {
          const vals = seriesMap.get(catId)!;
          const pts = mapPoints(vals, chartWidth, maxVal);
          const last = pts[pts.length - 1];
          const areaD = `${linePath(pts)} L ${last.x.toFixed(2)} ${bottomY.toFixed(2)} L ${pts[0].x.toFixed(2)} ${bottomY.toFixed(2)} Z`;
          return (
            <Path key={`area${catId}`} d={areaD} fill={`url(#grad${i})`} />
          );
        })}

        {topCatIds.map((catId, i) => {
          const vals = seriesMap.get(catId)!;
          const pts = mapPoints(vals, chartWidth, maxVal);
          return (
            <Path
              key={`line${catId}`}
              d={linePath(pts)}
              fill="none"
              stroke={LINE_COLORS[i]}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {topCatIds.map((catId, i) => {
          const vals = seriesMap.get(catId)!;
          const pts = mapPoints(vals, chartWidth, maxVal);
          return pts.map((p, j) => (
            <Circle key={`dot${catId}_${j}`} cx={p.x} cy={p.y} r="3" fill={colors.background} stroke={LINE_COLORS[i]} strokeWidth="1.5" />
          ));
        })}

        {months.map(({ month }, i) => {
          const x = PAD_H + (i / Math.max(months.length - 1, 1)) * (chartWidth - PAD_H * 2);
          return (
            <SvgText key={i} x={x} y={CHART_H - 6} fontSize="10" fill={colors.muted} textAnchor="middle">
              {getMonthShort(month)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexWrap: 'wrap', flexDirection: 'row', gap: 8, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11 },
});
