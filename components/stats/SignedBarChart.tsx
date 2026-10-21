import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { SPACING, TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

export type BarRow = {
	id: string;
	label: string;
	value: number;
	color: string;
};

type Props = {
	rows: BarRow[];
	/** Largeur de la colonne des libellés, à adapter à leur longueur (noms, catégories). */
	labelWidth?: number;
	formatValue?: (value: number) => string;
};

/**
 * Barres horizontales sur un axe zéro commun : les valeurs négatives partent à gauche, avec la
 * même échelle que les positives pour que les longueurs restent comparables.
 *
 * Dessinées avec de simples `View` (comme dans 7 Wonders Assistant) : en mode `horizontal`,
 * `react-native-gifted-charts` fait pivoter tout le graphique et rend les libellés de travers.
 */
export function SignedBarChart({ rows, labelWidth = 72, formatValue = String }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const maxPositive = Math.max(0, ...rows.map((r) => r.value));
	const maxNegative = Math.max(0, ...rows.map((r) => -r.value));
	const range = maxPositive + maxNegative || 1;

	return (
		<View style={styles.container}>
			{rows.map((row) => (
				<View
					key={row.id}
					style={styles.row}
					accessible
					accessibilityLabel={`${row.label} : ${formatValue(row.value)}`}
				>
					<Text
						style={[styles.label, { width: labelWidth }]}
						numberOfLines={1}
						maxFontSizeMultiplier={TIGHT_FONT_SCALE}
					>
						{row.label}
					</Text>
					<View style={styles.track}>
						{maxNegative > 0 && (
							<View style={[styles.side, styles.negativeSide, { flex: maxNegative / range }]}>
								{row.value < 0 && (
									<View
										style={[
											styles.bar,
											styles.negativeBar,
											{ width: `${(-row.value / maxNegative) * 100}%`, backgroundColor: row.color },
										]}
									/>
								)}
							</View>
						)}
						<View style={styles.zeroLine} />
						<View style={[styles.side, { flex: maxPositive > 0 ? maxPositive / range : 0 }]}>
							{row.value > 0 && (
								<View
									style={[
										styles.bar,
										styles.positiveBar,
										{ width: `${(row.value / maxPositive) * 100}%`, backgroundColor: row.color },
									]}
								/>
							)}
						</View>
					</View>
					<Text style={styles.value} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
						{formatValue(row.value)}
					</Text>
				</View>
			))}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.xs,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				label: {
					color: colors.textMuted,
					fontSize: 12,
					fontWeight: "600",
				},
				track: {
					flex: 1,
					flexDirection: "row",
					height: 24,
				},
				side: {
					justifyContent: "center",
				},
				negativeSide: {
					alignItems: "flex-end",
				},
				zeroLine: {
					width: 1,
					backgroundColor: colors.border,
				},
				bar: {
					height: 18,
				},
				negativeBar: {
					borderTopLeftRadius: 9,
					borderBottomLeftRadius: 9,
				},
				positiveBar: {
					borderTopRightRadius: 9,
					borderBottomRightRadius: 9,
				},
				value: {
					width: 40,
					textAlign: "right",
					color: colors.text,
					fontSize: 13,
					fontWeight: "600",
					fontVariant: ["tabular-nums"],
				},
			}),
		[colors],
	);
}
