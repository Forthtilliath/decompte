import { sum } from "@forthtilliath/ts-kit/number/sum";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { formatRank, RANK_MEDALS } from "@/constants/ranking";
import type { ThemeColors } from "@/constants/theme";
import { displayFont, RADIUS, SPACING, TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { sumByCategory, sumByRound } from "@/lib/rounds";
import type { RankedEntry } from "@/lib/scoring";
import type { CategoryDef, SessionEntry } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	/** Absent si le joueur a été supprimé depuis : ses points restent dans le classement. */
	player: Player | undefined;
	ranked: RankedEntry;
	entry: SessionEntry;
	categories: CategoryDef[];
	/** Nombre de manches du jeu : au-delà d'une, le détail par manche. */
	roundCount?: number;
};

/**
 * Ligne du classement : rang, joueur, total, points de chaque manche s'il y en a plusieurs, et
 * détail des points par catégorie toutes manches confondues (hors zéros). Un jeu à une seule
 * catégorie n'a pas de détail par catégorie : il redirait le total.
 */
export function RankedPlayerCard({ player, ranked, entry, categories, roundCount = 1 }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const byCategory = sumByCategory(entry.scores);
	const byRound = sumByRound(entry.scores, roundCount);
	// Points d'une catégorie retirée du jeu depuis la partie : toujours comptés dans le total, on
	// les montre à part pour que le détail reste égal au total affiché.
	const knownIds = new Set(categories.map((c) => c.id));
	const removedPoints = sum(
		Object.entries(byCategory)
			.filter(([categoryId]) => !knownIds.has(categoryId))
			.map(([, points]) => points),
	);

	const shownCategories =
		categories.length > 1 || removedPoints !== 0
			? categories.filter((category) => byCategory[category.id])
			: [];

	const name = player?.name ?? DELETED_PLAYER_LABEL;
	const details = [
		...(byRound.length > 1
			? byRound.map((points, index) => `manche ${index + 1} : ${points}`)
			: []),
		...shownCategories.map((category) => `${category.label} ${byCategory[category.id]}`),
		...(removedPoints !== 0 ? [`catégories retirées ${removedPoints}`] : []),
	];

	return (
		<View
			style={[styles.card, ranked.rank === 1 && styles.cardWinner]}
			// Une seule annonce par joueur (« 1er, Alice, 42 points… ») plutôt qu'un arrêt sur la
			// médaille, le nom, le total puis chaque puce.
			accessible
			accessibilityLabel={[
				`${formatRank(ranked.rank)}, ${name}, ${ranked.total} points`,
				...details,
			].join(", ")}
		>
			<View style={styles.header}>
				<Text style={styles.rank} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
					{RANK_MEDALS[ranked.rank] ?? `#${ranked.rank}`}
				</Text>
				<PlayerAvatar
					name={player?.name ?? "?"}
					avatarUri={player?.avatarUri}
					seed={ranked.playerId}
					size={44}
				/>
				<Text style={[styles.name, !player && styles.deletedName]} numberOfLines={1}>
					{name}
				</Text>
				<Text style={styles.total} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
					{ranked.total}
				</Text>
			</View>

			{byRound.length > 1 && (
				<View style={styles.rounds}>
					{byRound
						.map((points, index) => ({ round: index + 1, points }))
						.map(({ round, points }) => (
							<View key={round} style={styles.roundTile}>
								<Text style={styles.roundLabel}>M{round}</Text>
								<Text style={styles.roundPoints} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
									{points}
								</Text>
							</View>
						))}
				</View>
			)}

			{(shownCategories.length > 0 || removedPoints !== 0) && (
				<View style={styles.breakdown}>
					{shownCategories.map((category) => (
						<View key={category.id} style={styles.chip}>
							<View style={[styles.dot, { backgroundColor: category.color }]} />
							<Text style={styles.chipText}>
								{category.label} {byCategory[category.id]}
							</Text>
						</View>
					))}
					{removedPoints !== 0 && (
						<View style={styles.chip}>
							<Text style={styles.chipText}>Catégories retirées {removedPoints}</Text>
						</View>
					)}
				</View>
			)}
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
					...colors.decor.card,
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
				deletedName: {
					color: colors.textMuted,
					fontStyle: "italic",
				},
				total: {
					color: colors.gold,
					fontSize: 22,
					fontWeight: "800",
					...displayFont(colors),
				},
				rounds: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.xs,
				},
				roundTile: {
					minWidth: 40,
					alignItems: "center",
					backgroundColor: colors.surfaceAlt,
					borderRadius: RADIUS.sm,
					paddingHorizontal: SPACING.xs,
					paddingVertical: 2,
				},
				roundLabel: {
					color: colors.textMuted,
					fontSize: 10,
					fontWeight: "600",
				},
				roundPoints: {
					color: colors.text,
					fontSize: 15,
					fontWeight: "700",
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
