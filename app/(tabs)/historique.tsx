import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { rankEntries } from "@/lib/scoring";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";

export default function HistoryScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const sessions = useHistoryStore((s) => s.sessions);
	const games = useGamesStore((s) => s.games);
	const players = usePlayersStore((s) => s.players);

	return (
		<ScreenContainer>
			<ScrollView contentContainerStyle={styles.list}>
				{sessions.map((session) => {
					const game = games.find((g) => g.id === session.gameDefId);
					const ranking = rankEntries(Object.values(session.entries));
					const winnerId = ranking.find((r) => r.rank === 1)?.playerId;
					const winner = players.find((p) => p.id === winnerId);
					return (
						<View key={session.id} style={styles.card}>
							<View style={styles.cardHeader}>
								<Text style={styles.gameName}>{game?.name ?? "Jeu supprimé"}</Text>
								<Text style={styles.date}>
									{new Date(session.createdAt).toLocaleDateString("fr-FR")}
								</Text>
							</View>
							<Text style={styles.winner}>
								🏆 {winner?.name ?? "?"} · {session.playerIds.length} joueur(s)
							</Text>
						</View>
					);
				})}
				{sessions.length === 0 && (
					<Text style={styles.empty}>Aucune partie enregistrée pour l'instant.</Text>
				)}
			</ScrollView>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				list: {
					gap: SPACING.sm,
				},
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.xs,
				},
				cardHeader: {
					flexDirection: "row",
					justifyContent: "space-between",
				},
				gameName: {
					color: colors.text,
					fontSize: 16,
					fontWeight: "700",
				},
				date: {
					color: colors.textMuted,
					fontSize: 13,
				},
				winner: {
					color: colors.textMuted,
					fontSize: 14,
				},
				empty: {
					color: colors.textMuted,
					textAlign: "center",
					marginTop: SPACING.lg,
				},
			}),
		[colors],
	);
}
