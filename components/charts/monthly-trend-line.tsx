import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, {
  Path, Defs, LinearGradient, Stop, Line, Circle,
  Text as SvgText,
} from 'react-native-svg';
import { useColors } from '@/hooks/use-colors';
import { getMonthShort } from '@/lib/utils/date';
import { EmptyState } from '@/components/ui/empty-state';
import type { MonthlySummary } from '@/types';

interface MonthlyTrendLineProps {
  data: MonthlySummary[];
}

// Catmull-Rom → cubic Bézier tension
const TENSION = 0.35;
const PAD_TOP = 16;
const PAD_BOTTOM = 26; // space for x-axis labels
const PAD_H = 4;       // left/right breathing room
const CHART_H = 170;

function mapPoints(
  values: number[],
  width: number,
  min: number,
  max: number,
): { x: number; y: number }[] {
  const n = values.length;
  const range = max - min || 1;
  const innerW = width - PAD_H * 2;
  const innerH = CHART_H - PAD_TOP - PAD_BOTTOM;
  return values.map((v, i) => ({
    x: PAD_H + (i / (n - 1)) * innerW,
    y: PAD_TOP + (1 - (v - min) / range) * innerH,
  }));
}

function linePath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return '';
  let d = `M ${f(pts[0].x)} ${f(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[i - 2] ?? pts[0];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[i + 1] ?? pts[pts.length - 1];
    const cp1x = p1.x + (p2.x - p0.x) * TENSION;
    const cp1y = p1.y + (p2.y - p0.y) * TENSION;
    const cp2x = p2.x - (p3.x - p1.x) * TENSION;
    const cp2y = p2.y - (p3.y - p1.y) * TENSION;
    d += ` C ${f(cp1x)} ${f(cp1y)} ${f(cp2x)} ${f(cp2y)} ${f(p2.x)} ${f(p2.y)}`;
  }
  return d;
}

function areaPath(pts: { x: number; y: number }[], bottomY: number): string {
  const last = pts[pts.length - 1];
  return `${linePath(pts)} L ${f(last.x)} ${f(bottomY)} L ${f(pts[0].x)} ${f(bottomY)} Z`;
}

function f(n: number) { return n.toFixed(2); }

export function MonthlyTrendLine({ data }: MonthlyTrendLineProps) {
  const { width: screenWidth } = useWindowDimensions();
  const colors = useColors();
  // 16 scroll padding + 20 card padding = 36 each side
  const chartWidth = screenWidth - 72;

  const hasData = data.length > 0 && data.some((d) => d.totalIncome > 0 || d.totalExpenses > 0);
  if (!hasData) {
    return (
      <EmptyState
        icon="show-chart"
        title="No trend data yet"
        body="Add income or expenses to see your 6-month trend."
      />
    );
  }

  const rawIncome = data.map((d) => d.totalIncome);
  const rawExpenses = data.map((d) => d.totalExpenses);
  const maxVal = Math.max(...rawIncome, ...rawExpenses, 1);

  const incPts = mapPoints(rawIncome, chartWidth, 0, maxVal);
  const expPts = mapPoints(rawExpenses, chartWidth, 0, maxVal);
  const bottomY = CHART_H - PAD_BOTTOM;

  // Subtle horizontal grid at 25 / 50 / 75 %
  const gridYs = [0.25, 0.5, 0.75].map(
    (f) => PAD_TOP + (1 - f) * (CHART_H - PAD_TOP - PAD_BOTTOM),
  );

  return (
    <View style={styles.container}>
      <Svg width={chartWidth} height={CHART_H}>
        <Defs>
          <LinearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.positive} stopOpacity="0.35" />
            <Stop offset="100%" stopColor={colors.positive} stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors.negative} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={colors.negative} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {gridYs.map((y, i) => (
          <Line
            key={i}
            x1={PAD_H}
            y1={y}
            x2={chartWidth - PAD_H}
            y2={y}
            stroke="#FFFFFF0A"
            strokeWidth="1"
          />
        ))}

        {/* Baseline */}
        <Line
          x1={PAD_H}
          y1={bottomY}
          x2={chartWidth - PAD_H}
          y2={bottomY}
          stroke="#FFFFFF14"
          strokeWidth="1"
        />

        {/* Gradient fills */}
        <Path d={areaPath(expPts, bottomY)} fill="url(#expGrad)" />
        <Path d={areaPath(incPts, bottomY)} fill="url(#incGrad)" />

        {/* Lines */}
        <Path
          d={linePath(expPts)}
          fill="none"
          stroke={colors.negative}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d={linePath(incPts)}
          fill="none"
          stroke={colors.positive}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots — expense */}
        {expPts.map((p, i) => (
          <Circle key={`e${i}`} cx={p.x} cy={p.y} r="3.5" fill="#141414" stroke={colors.negative} strokeWidth="1.5" />
        ))}
        {/* Dots — income */}
        {incPts.map((p, i) => (
          <Circle key={`i${i}`} cx={p.x} cy={p.y} r="3.5" fill="#141414" stroke={colors.positive} strokeWidth="1.5" />
        ))}

        {/* X-axis labels */}
        {incPts.map((p, i) => (
          <SvgText
            key={`l${i}`}
            x={p.x}
            y={CHART_H - 6}
            fontSize="10"
            fill={colors.muted}
            textAnchor="middle"
          >
            {getMonthShort(data[i].month)}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', marginHorizontal: -4 },
});
