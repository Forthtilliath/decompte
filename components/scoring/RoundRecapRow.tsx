import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatRank, RANK_MEDALS } from "@/constants/ranking";
import type { ThemeColors } from "@/constants/theme";
import { displayFont, RADIUS, SPACING, TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { RoundRecapLine } from "@/lib/roundRecap";

type Props = {
	line: RoundRecapLine;
	/** Seuil de fin de partie : la ligne dit combien il reste avant, ou qu'il est atteint. */
	scoreLimit?: number;
};

const signed = (points: number) => (points > 0 ? `+${points}` : `${points}`);

/** Ligne du récapitulatif de fin de manche : rang, nom, points de la manche et total cumulé. */
export function RoundRecapRow({ line, scoreLimit }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const reached = scoreLimit !== undefined && line.total >= scoreLimit;
	const detail = [
		`${signed(line.roundPoints)} cette manche`,
		...(scoreLimit === undefined
			? []
			: [reached ? "seuil atteint" : `encore ${scoreLimit - line.total} avant ${scoreLimit}`]),
	].join("  ·  ");

	return (
		<View
			style={[styles.card, reached && styles.cardReached]}
			accessible
			accessibilityLabel={`${formatRank(line.rank)}, ${line.name}, ${line.total} points, ${detail}`}
		>
			<Text style={styles.rank} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
				{RANK_MEDALS[line.rank] ?? `#${line.rank}`}
			</Text>
			<View style={styles.body}>
				<Text style={styles.name} numberOfLines={1}>
					{line.name}
				</Text>
				<Text style={[styles.detail, reached && styles.detailReached]}>{detail}</Text>
			</View>
			<Text style={styles.total} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
				{line.total}
			</Text>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					borderWidth: 1.5,
					borderColor: colors.border,
					...colors.decor.card,
				},
				cardReached: {
					borderColor: colors.danger,
				},
				rank: {
					fontSize: 20,
					minWidth: 32,
					textAlign: "center",
					color: colors.textMuted,
					fontWeight: "700",
				},
				body: {
					flex: 1,
					gap: 2,
				},
				name: {
					color: colors.text,
					fontSize: 16,
					fontWeight: "700",
				},
				detail: {
					color: colors.textMuted,
					fontSize: 13,
				},
				detailReached: {
					color: colors.danger,
					fontWeight: "700",
				},
				total: {
					color: colors.text,
					fontSize: 22,
					fontWeight: "800",
					...displayFont(colors),
				},
			}),
		[colors],
	);
}
