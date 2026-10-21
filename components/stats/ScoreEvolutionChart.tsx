import { useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

export type EvolutionSeries = {
	id: string;
	label: string;
	color: string;
	/** Total cumulé à la fin de chaque manche (index 0 = manche 1). */
	totals: number[];
};

type Props = {
	series: EvolutionSeries[];
};

const Y_AXIS_WIDTH = 36;
const SIDE_SPACING = 12;
const SECTIONS = 4;

/** Pas de graduation « rond » (1, 2, 5, 10, 20…) pour couvrir `range` en environ 4 sections. */
function niceStep(range: number): number {
	const raw = Math.max(range, 1) / SECTIONS;
	const magnitude = 10 ** Math.floor(Math.log10(raw));
	const step = [1, 2, 5, 10].find((m) => m * magnitude >= raw) ?? 10;
	return Math.max(1, step * magnitude);
}

/**
 * Évolution du total de chaque joueur au fil des manches, une courbe par joueur. Les valeurs
 * négatives ont leurs propres graduations sous l'axe, à la même échelle que les positives.
 */
export function ScoreEvolutionChart({ series }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const [width, setWidth] = useState(0);

	const roundCount = Math.max(1, ...series.map((s) => s.totals.length));
	const values = series.flatMap((s) => s.totals);
	const max = Math.max(0, ...values);
	const min = Math.min(0, ...values);
	const step = niceStep(max - min);
	const sectionsAbove = Math.max(1, Math.ceil(max / step));
	const sectionsBelow = Math.ceil(-min / step);
	const chartWidth = Math.max(0, width - Y_AXIS_WIDTH - SPACING.sm);

	return (
		<View style={styles.container}>
			{/* Le lecteur d'écran lit la légende et les barres par manche, qui donnent les chiffres. */}
			<View
				onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
			>
				{chartWidth > 0 && (
					<LineChart
						dataSet={series.map((s) => ({
							data: s.totals.map((value) => ({ value })),
							color: s.color,
							dataPointsColor: s.color,
							thickness: 2,
						}))}
						width={chartWidth}
						height={160}
						initialSpacing={SIDE_SPACING}
						endSpacing={SIDE_SPACING}
						spacing={(chartWidth - 2 * SIDE_SPACING) / Math.max(roundCount - 1, 1)}
						stepValue={step}
						noOfSections={sectionsAbove}
						maxValue={sectionsAbove * step}
						noOfSectionsBelowXAxis={sectionsBelow}
						mostNegativeValue={-sectionsBelow * step}
						xAxisLabelTexts={Array.from({ length: roundCount }, (_, i) => `M${i + 1}`)}
						yAxisLabelWidth={Y_AXIS_WIDTH}
						yAxisTextStyle={styles.axisText}
						xAxisLabelTextStyle={styles.axisText}
						yAxisColor={colors.border}
						xAxisColor={colors.border}
						rulesColor={colors.border}
						dataPointsRadius={3}
						disableScroll
					/>
				)}
			</View>
			<View style={styles.legend}>
				{series.map((s) => {
					const total = s.totals.at(-1) ?? 0;
					return (
						<View
							key={s.id}
							style={styles.legendRow}
							accessible
							accessibilityLabel={`${s.label} : ${total} au final`}
						>
							<View style={[styles.dot, { backgroundColor: s.color }]} />
							<Text style={styles.legendLabel} numberOfLines={1}>
								{s.label}
							</Text>
							<Text style={styles.legendValue}>{total}</Text>
						</View>
					);
				})}
			</View>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.sm,
				},
				axisText: {
					color: colors.textMuted,
					fontSize: 11,
				},
				legend: {
					gap: 6,
				},
				legendRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: 6,
				},
				dot: {
					width: 10,
					height: 10,
					borderRadius: RADIUS.full,
				},
				legendLabel: {
					flex: 1,
					color: colors.textMuted,
					fontSize: 12,
				},
				legendValue: {
					color: colors.text,
					fontSize: 12,
					fontWeight: "700",
					fontVariant: ["tabular-nums"],
				},
			}),
		[colors],
	);
}
