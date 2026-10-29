import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CategoryPieChart } from "@/components/stats/CategoryPieChart";
import { ScoreEvolutionChart } from "@/components/stats/ScoreEvolutionChart";
import { SignedBarChart } from "@/components/stats/SignedBarChart";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { getAvatarColor } from "@/lib/avatarColor";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { cumulateRounds, getLastScoredRound, sumByCategory, sumByRound } from "@/lib/rounds";
import type { RankedEntry } from "@/lib/scoring";
import type { CategoryDef, SessionEntry } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	categories: CategoryDef[];
	ranking: RankedEntry[];
	entries: Record<string, SessionEntry>;
	/** Tous les joueurs connus : ceux supprimés depuis la partie s'affichent sous un libellé neutre. */
	players: Player[];
	/** Manches de la partie : au-delà d'une, s'ajoutent les graphiques par manche. */
	roundCount: number;
};

/**
 * Graphiques d'une partie : répartition des points de chaque joueur, comparaison des joueurs
 * catégorie par catégorie, puis, en plusieurs manches, évolution des totaux et comparaison manche
 * par manche. Partagés entre l'écran de résultats et le détail d'une partie.
 */
export function GameCharts({ categories, ranking, entries, players, roundCount }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	// Manches réellement jouées : en manches ouvertes, le jeu n'en fixe pas le nombre.
	const playedRounds = Math.max(roundCount, getLastScoredRound(Object.values(entries)));
	const rows = ranking.map((ranked) => {
		const player = players.find((p) => p.id === ranked.playerId);
		const playerScores = entries[ranked.playerId]?.scores ?? {};
		return {
			ranked,
			player,
			label: player?.name ?? DELETED_PLAYER_LABEL,
			// Même couleur que l'avatar sans photo du joueur, partout dans l'app.
			color: getAvatarColor(ranked.playerId),
			// Toutes manches confondues : une part / une barre par catégorie.
			scores: sumByCategory(playerScores),
			rounds: sumByRound(playerScores, playedRounds),
		};
	});

	// Avec une seule catégorie, chaque joueur aurait un camembert à 100 % : rien à répartir.
	const hasSeveralCategories = categories.length > 1;

	return (
		<View style={styles.container}>
			{hasSeveralCategories && (
				<>
					<SectionTitle>Répartition par joueur</SectionTitle>
					{rows.map(({ ranked, player, label, scores }) => (
						<View key={ranked.playerId} style={styles.card}>
							<View style={styles.cardHeader}>
								<PlayerAvatar
									name={player?.name ?? "?"}
									avatarUri={player?.avatarUri}
									seed={ranked.playerId}
									size={32}
								/>
								<Text style={styles.cardTitle} numberOfLines={1}>
									{label}
								</Text>
							</View>
							<CategoryPieChart categories={categories} values={scores} />
						</View>
					))}
				</>
			)}

			<SectionTitle>Comparaison par catégorie</SectionTitle>
			{categories.map((category) => (
				<View key={category.id} style={styles.card}>
					<View style={styles.cardHeader}>
						<View style={[styles.dot, { backgroundColor: category.color }]} />
						<Text style={styles.cardTitle} numberOfLines={1}>
							{category.label}
						</Text>
					</View>
					<SignedBarChart
						rows={rows.map(({ ranked, label, color, scores }) => ({
							id: ranked.playerId,
							label,
							value: scores[category.id] ?? 0,
							color,
						}))}
					/>
				</View>
			))}

			{playedRounds > 1 && (
				<>
					<SectionTitle>Évolution du score</SectionTitle>
					<View style={styles.card}>
						<ScoreEvolutionChart
							series={rows.map(({ ranked, label, color, rounds }) => ({
								id: ranked.playerId,
								label,
								color,
								totals: cumulateRounds(rounds),
							}))}
						/>
					</View>

					<SectionTitle>Comparaison par manche</SectionTitle>
					{Array.from({ length: playedRounds }, (_, i) => i + 1).map((round) => (
						<View key={round} style={styles.card}>
							<Text style={styles.cardTitle}>Manche {round}</Text>
							<SignedBarChart
								rows={rows.map(({ ranked, label, color, rounds }) => ({
									id: ranked.playerId,
									label,
									value: rounds[round - 1] ?? 0,
									color,
								}))}
							/>
						</View>
					))}
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
					gap: SPACING.sm,
				},
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.sm,
					...colors.decor.card,
				},
				cardHeader: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				cardTitle: {
					flex: 1,
					color: colors.text,
					fontSize: 15,
					fontWeight: "700",
				},
				dot: {
					width: 12,
					height: 12,
					borderRadius: RADIUS.full,
				},
			}),
		[colors],
	);
}
