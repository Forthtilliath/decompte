import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING, TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	label: string;
	value: string;
};

/** Chiffre clé mis en avant (parties jouées, taux de victoire...). */
export function StatTile({ label, value }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.tile} accessible accessibilityLabel={`${label} : ${value}`}>
			<Text style={styles.value} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
				{value}
			</Text>
			<Text style={styles.label} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
				{label}
			</Text>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				tile: {
					flex: 1,
					minWidth: 90,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					paddingVertical: SPACING.md,
					paddingHorizontal: SPACING.xs,
					alignItems: "center",
					gap: 2,
				},
				value: {
					color: colors.gold,
					fontSize: 22,
					fontWeight: "800",
				},
				label: {
					color: colors.textMuted,
					fontSize: 12,
					textAlign: "center",
				},
			}),
		[colors],
	);
}
