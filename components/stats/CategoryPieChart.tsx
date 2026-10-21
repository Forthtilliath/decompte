import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { CategoryDef } from "@/types/game";

type Props = {
	categories: CategoryDef[];
	/** Points par id de catégorie (moyenne sur l'historique, ou score d'une seule partie). */
	values: Record<string, number>;
};

/**
 * Répartition (en %) des points entre les catégories, pour voir comment un score se construit.
 * Les catégories nulles ou négatives (malus) sont écartées : une part négative n'a pas de sens.
 */
export function CategoryPieChart({ categories, values }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const slices = categories
		.map((category) => ({ category, value: Math.max(0, values[category.id] ?? 0) }))
		.filter((slice) => slice.value > 0);
	const total = slices.reduce((sum, slice) => sum + slice.value, 0);

	if (total === 0) {
		return (
			<Text style={styles.empty}>Pas assez de points positifs pour afficher une répartition.</Text>
		);
	}

	return (
		<View style={styles.row}>
			{/* Le lecteur d'écran lit la légende, qui donne les mêmes parts en texte. */}
			<View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
				<PieChart
					data={slices.map((slice) => ({ value: slice.value, color: slice.category.color }))}
					radius={64}
					donut
					innerRadius={34}
					innerCircleColor={colors.surface}
				/>
			</View>
			<View style={styles.legend}>
				{slices.map(({ category, value }) => {
					const percent = `${Math.round((value / total) * 100)}%`;
					return (
						<View
							key={category.id}
							style={styles.legendRow}
							accessible
							accessibilityLabel={`${category.label} : ${percent}`}
						>
							<View style={[styles.dot, { backgroundColor: category.color }]} />
							<Text style={styles.legendLabel} numberOfLines={1}>
								{category.label}
							</Text>
							<Text style={styles.legendValue}>{percent}</Text>
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
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.md,
				},
				legend: {
					flex: 1,
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
				},
				empty: {
					color: colors.textMuted,
					fontStyle: "italic",
				},
			}),
		[colors],
	);
}
