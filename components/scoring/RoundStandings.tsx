import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { formatRank, RANK_MEDALS } from "@/constants/ranking";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING, TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { plural } from "@/lib/plural";
import type { RoundRecapLine } from "@/lib/roundRecap";

type Props = {
	/** Classement à la fin de chaque manche (voir getRoundStandings). */
	standings: RoundRecapLine[][];
};

const signed = (points: number) => (points > 0 ? `+${points}` : `${points}`);

/** Places gagnées (positif) ou perdues depuis la manche précédente, `null` à la première. */
function rankShift(line: RoundRecapLine, previous: RoundRecapLine[] | undefined): number | null {
	const before = previous?.find((p) => p.id === line.id);
	return before ? before.rank - line.rank : null;
}

function describeShift(shift: number | null): string | null {
	if (!shift) return null;
	const places = `${Math.abs(shift)} ${plural(Math.abs(shift), "place")}`;
	return shift > 0 ? `gagne ${places}` : `perd ${places}`;
}

/**
 * Classement manche par manche : pour chacune, rang, points de la manche, total cumulé et places
 * gagnées ou perdues depuis la précédente.
 */
export function RoundStandings({ standings }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.container}>
			{standings
				.map((lines, index) => ({ round: index + 1, lines, previous: standings[index - 1] }))
				.map(({ round, lines, previous }) => (
					<View key={round} style={styles.card}>
						<Text style={styles.title} accessibilityRole="header">
							Manche {round}
						</Text>
						{lines.map((line) => {
							const shift = rankShift(line, previous);
							return (
								<View
									key={line.id}
									style={styles.row}
									accessible
									accessibilityLabel={[
										`${formatRank(line.rank)}, ${line.name}, ${line.total} points`,
										`${signed(line.roundPoints)} cette manche`,
										describeShift(shift),
									]
										.filter(Boolean)
										.join(", ")}
								>
									<Text style={styles.rank} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
										{RANK_MEDALS[line.rank] ?? `#${line.rank}`}
									</Text>
									<Text style={styles.name} numberOfLines={1}>
										{line.name}
									</Text>
									{!!shift && (
										<Text style={[styles.shift, shift > 0 ? styles.shiftUp : styles.shiftDown]}>
											{shift > 0 ? "▲" : "▼"}
											{Math.abs(shift)}
										</Text>
									)}
									<Text style={styles.roundPoints}>{signed(line.roundPoints)}</Text>
									<Text style={styles.total} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
										{line.total}
									</Text>
								</View>
							);
						})}
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
					gap: SPACING.sm,
				},
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.xs,
					...colors.decor.card,
				},
				title: {
					color: colors.text,
					fontSize: 15,
					fontWeight: "700",
					marginBottom: 2,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				rank: {
					width: 28,
					textAlign: "center",
					color: colors.textMuted,
					fontSize: 15,
					fontWeight: "700",
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 14,
				},
				shift: {
					fontSize: 11,
					fontWeight: "700",
				},
				shiftUp: {
					color: colors.success,
				},
				shiftDown: {
					color: colors.danger,
				},
				roundPoints: {
					minWidth: 36,
					textAlign: "right",
					color: colors.textMuted,
					fontSize: 13,
				},
				total: {
					minWidth: 32,
					textAlign: "right",
					color: colors.text,
					fontSize: 15,
					fontWeight: "800",
				},
			}),
		[colors],
	);
}
