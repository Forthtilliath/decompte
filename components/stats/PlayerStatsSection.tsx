import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CategoryPieChart } from "@/components/stats/CategoryPieChart";
import { RankingRow } from "@/components/stats/RankingRow";
import { SignedBarChart } from "@/components/stats/SignedBarChart";
import { StatTile } from "@/components/stats/StatTile";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { plural } from "@/lib/plural";
import { getRoundCount } from "@/lib/rounds";
import {
	computePlayerGameStats,
	computePlayerRoundAverages,
	computePlayerStats,
	formatAverage,
	formatRate,
} from "@/lib/stats";
import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	player: Player;
	/** Historique déjà filtré par jeu en amont. */
	sessions: Session[];
	/** Jeu filtré : active les moyennes par catégorie. Absent, tous jeux confondus. */
	game?: GameDef;
	games: GameDef[];
};

/**
 * Statistiques d'un joueur : chiffres clés, puis points moyens et répartition par catégorie pour
 * un jeu donné, ou ses résultats jeu par jeu tous jeux confondus.
 */
export function PlayerStatsSection({ player, sessions, game, games }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const stats = useMemo(
		() => computePlayerStats(player.id, sessions, game?.categories),
		[player.id, sessions, game],
	);
	const perGame = useMemo(
		() => (game ? [] : computePlayerGameStats(player.id, sessions)),
		[game, player.id, sessions],
	);
	// Une moyenne par manche n'a de sens que pour un jeu qui en a plusieurs.
	const roundAverages = useMemo(
		() =>
			game && (game.openRounds || getRoundCount(game) > 1)
				? computePlayerRoundAverages(player.id, sessions, getRoundCount(game))
				: [],
		[game, player.id, sessions],
	);

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<PlayerAvatar name={player.name} avatarUri={player.avatarUri} seed={player.id} size={36} />
				<Text style={styles.name} numberOfLines={1}>
					{player.name}
				</Text>
			</View>

			{stats.gamesPlayed === 0 ? (
				<Text style={styles.empty}>Aucune partie de {player.name} ne correspond à ce filtre.</Text>
			) : (
				<>
					<View style={styles.tilesRow}>
						<StatTile label="Parties jouées" value={String(stats.gamesPlayed)} />
						<StatTile label="Victoires" value={String(stats.wins)} />
						<StatTile label="Taux de victoire" value={formatRate(stats.winRate)} />
					</View>

					{game ? (
						<>
							<View style={styles.tilesRow}>
								<StatTile label="Score moyen" value={formatAverage(stats.averageTotal)} />
								<StatTile label="Meilleur score" value={String(stats.bestTotal)} />
							</View>

							<SectionTitle>Points moyens par catégorie</SectionTitle>
							<View style={styles.card}>
								<SignedBarChart
									labelWidth={96}
									formatValue={formatAverage}
									rows={game.categories.map((category) => ({
										id: category.id,
										label: category.label,
										value: stats.averageByCategory[category.id] ?? 0,
										color: category.color,
									}))}
								/>
							</View>

							<SectionTitle>Répartition des points</SectionTitle>
							<View style={styles.card}>
								<CategoryPieChart categories={game.categories} values={stats.averageByCategory} />
							</View>

							{roundAverages.length > 1 && (
								<>
									<SectionTitle>Points moyens par manche</SectionTitle>
									<View style={styles.card}>
										<SignedBarChart
											labelWidth={96}
											formatValue={formatAverage}
											rows={roundAverages.map((average, index) => ({
												id: String(index + 1),
												label: `Manche ${index + 1}`,
												value: average,
												color: colors.primary,
											}))}
										/>
									</View>
								</>
							)}
						</>
					) : (
						<>
							<SectionTitle>Ses jeux</SectionTitle>
							<View style={styles.list}>
								{perGame.map((entry, index) => (
									<RankingRow
										key={entry.gameDefId}
										rank={index + 1}
										title={games.find((g) => g.id === entry.gameDefId)?.name ?? "Jeu inconnu"}
										meta={`${entry.wins} ${plural(entry.wins, "victoire")} sur ${entry.gamesPlayed} ${plural(entry.gamesPlayed, "partie")}`}
										value={formatRate(entry.winRate)}
									/>
								))}
							</View>
						</>
					)}
				</>
			)}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.md,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 18,
					fontWeight: "700",
				},
				tilesRow: {
					flexDirection: "row",
					gap: SPACING.sm,
				},
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					...colors.decor.card,
				},
				list: {
					gap: SPACING.xs,
				},
				empty: {
					color: colors.textMuted,
					fontStyle: "italic",
				},
			}),
		[colors],
	);
}
