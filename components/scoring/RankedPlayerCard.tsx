import { sum } from "@forthtilliath/ts-kit/number/sum";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { RANK_MEDALS } from "@/constants/ranking";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { RankedEntry } from "@/lib/scoring";
import type { CategoryDef, SessionEntry } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	player: Player;
	ranked: RankedEntry;
	entry: SessionEntry;
	categories: CategoryDef[];
};

/** Ligne du classement : rang, joueur, total, et détail des points par catégorie (hors zéros). */
export function RankedPlayerCard({ player, ranked, entry, categories }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	// Points d'une catégorie retirée du jeu depuis la partie : toujours comptés dans le total, on
	// les montre à part pour que le détail reste égal au total affiché.
	const knownIds = new Set(categories.map((c) => c.id));
	const removedPoints = sum(
		Object.entries(entry.scores)
			.filter(([categoryId]) => !knownIds.has(categoryId))
			.map(([, points]) => points),
	);

	return (
		<View style={[styles.card, ranked.rank === 1 && styles.cardWinner]}>
			<View style={styles.header}>
				<Text style={styles.rank}>{RANK_MEDALS[ranked.rank] ?? `#${ranked.rank}`}</Text>
				<PlayerAvatar name={player.name} avatarUri={player.avatarUri} seed={player.id} size={44} />
				<Text style={styles.name} numberOfLines={1}>
					{player.name}
				</Text>
				<Text style={styles.total}>{ranked.total}</Text>
			</View>

			<View style={styles.breakdown}>
				{categories.map((category) => {
					const value = entry.scores[category.id];
					if (!value) return null;
					return (
						<View key={category.id} style={styles.chip}>
							<View style={[styles.dot, { backgroundColor: category.color }]} />
							<Text style={styles.chipText}>
								{category.label} {value}
							</Text>
						</View>
					);
				})}
				{removedPoints !== 0 && (
					<View style={styles.chip}>
						<Text style={styles.chipText}>Catégories retirées {removedPoints}</Text>
					</View>
				)}
			</View>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.sm,
					borderWidth: 1.5,
					borderColor: "transparent",
				},
				cardWinner: {
					borderColor: colors.gold,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				rank: {
					color: colors.textMuted,
					fontSize: 20,
					fontWeight: "800",
					width: 32,
					textAlign: "center",
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 17,
					fontWeight: "700",
				},
				total: {
					color: colors.gold,
					fontSize: 22,
					fontWeight: "800",
				},
				breakdown: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.xs,
				},
				chip: {
					flexDirection: "row",
					alignItems: "center",
					gap: 4,
					backgroundColor: colors.surfaceAlt,
					borderRadius: RADIUS.full,
					paddingHorizontal: SPACING.sm,
					paddingVertical: 2,
				},
				dot: {
					width: 8,
					height: 8,
					borderRadius: RADIUS.full,
				},
				chipText: {
					color: colors.textMuted,
					fontSize: 11,
				},
			}),
		[colors],
	);
}
