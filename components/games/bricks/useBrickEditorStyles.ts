import { useMemo } from "react";
import { StyleSheet } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

/** Styles communs aux éditeurs de type de calcul d'une catégorie. */
export function useBrickEditorStyles() {
	const colors = useColors();
	return { colors, styles: useStyles(colors) };
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				fields: {
					gap: SPACING.sm,
					marginTop: SPACING.xs,
				},
				switchRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				switchLabel: {
					flex: 1,
					color: colors.text,
					fontSize: 14,
				},
				// Chaque jeton/valeur dans sa propre carte : sans ça, les entrées successives se
				// fondent les unes dans les autres et on ne voit plus où l'une finit et l'autre commence.
				itemRow: {
					backgroundColor: colors.surfaceAlt,
					borderRadius: RADIUS.sm,
					padding: SPACING.sm,
					gap: SPACING.xs,
				},
				itemIndex: {
					color: colors.textMuted,
					fontSize: 12,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 0.5,
				},
				itemFields: {
					flexDirection: "row",
					alignItems: "flex-end",
					gap: SPACING.sm,
				},
				itemLabel: {
					flex: 2,
				},
				itemValue: {
					flex: 1,
				},
				itemRemove: {
					paddingBottom: SPACING.sm,
				},
			}),
		[colors],
	);
}
