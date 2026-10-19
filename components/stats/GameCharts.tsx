import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CategoryPieChart } from "@/components/stats/CategoryPieChart";
import { SignedBarChart } from "@/components/stats/SignedBarChart";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { getAvatarColor } from "@/lib/avatarColor";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { sumByCategory } from "@/lib/rounds";
import type { RankedEntry } from "@/lib/scoring";
import type { CategoryDef, SessionEntry } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	categories: CategoryDef[];
	ranking: RankedEntry[];
	entries: Record<string, SessionEntry>;
	/** Tous les joueurs connus : ceux supprimés depuis la partie s'affichent sous un libellé neutre. */
	players: Player[];
};

/**
 * Graphiques d'une partie : répartition des points de chaque joueur, puis comparaison des joueurs
 * catégorie par catégorie. Partagés entre l'écran de résultats et le détail d'une partie.
 */
export function GameCharts({ categories, ranking, entries, players }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const rows = ranking.map((ranked) => ({
		ranked,
		player: players.find((p) => p.id === ranked.playerId),
		// Toutes manches confondues : une part / une barre par catégorie, pas par manche.
		scores: sumByCategory(entries[ranked.playerId]?.scores ?? {}),
	}));

	return (
		<View style={styles.container}>
			<SectionTitle>Répartition par joueur</SectionTitle>
			{rows.map(({ ranked, player, scores }) => (
				<View key={ranked.playerId} style={styles.card}>
					<View style={styles.cardHeader}>
						<PlayerAvatar
							name={player?.name ?? "?"}
							avatarUri={player?.avatarUri}
							seed={ranked.playerId}
							size={32}
						/>
						<Text style={styles.cardTitle} numberOfLines={1}>
							{player?.name ?? DELETED_PLAYER_LABEL}
						</Text>
					</View>
					<CategoryPieChart categories={categories} values={scores} />
				</View>
			))}

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
						rows={rows.map(({ ranked, player, scores }) => ({
							id: ranked.playerId,
							label: player?.name ?? DELETED_PLAYER_LABEL,
							value: scores[category.id] ?? 0,
							// Même couleur que l'avatar sans photo du joueur, partout dans l'app.
							color: getAvatarColor(ranked.playerId),
						}))}
					/>
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
					gap: SPACING.sm,
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
