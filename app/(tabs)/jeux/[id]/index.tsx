import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { SessionSummaryCard } from "@/components/history/SessionSummaryCard";
import { SelectablePlayerCard } from "@/components/players/SelectablePlayerCard";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useOngoingSession } from "@/hooks/useOngoingSession";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { selectSortedPlayers, usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

export default function GameDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const game = useGamesStore((s) => s.games.find((g) => g.id === id));
	const toggleArchived = useGamesStore((s) => s.toggleArchived);
	const players = usePlayersStore((s) => s.players);
	// `.filter()` retourne un nouveau tableau à chaque rendu : le sélectionner directement
	// casserait la stabilité de référence attendue par Zustand et provoquerait une boucle de rendu
	// infinie. On sélectionne le tableau brut (stable) et on filtre nous-mêmes, mémorisé.
	const allSessions = useHistoryStore((s) => s.sessions);
	const sessions = useMemo(
		() => allSessions.filter((sess) => sess.gameDefId === id),
		[allSessions, id],
	);
	const sessionGameDefId = useSessionStore((s) => s.gameDefId);
	const startNewSession = useSessionStore((s) => s.startNewSession);
	const { hasOngoingSession, resume, confirmAbandon } = useOngoingSession();

	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	if (!game) return null;

	const activePlayers = selectSortedPlayers(players.filter((p) => !p.isArchived));
	const isThisGameOngoing = hasOngoingSession && sessionGameDefId === game.id;
	const otherGameOngoing = hasOngoingSession && sessionGameDefId !== game.id;

	const toggleSelected = (playerId: string) => {
		setSelectedIds((current) => {
			if (current.includes(playerId)) return current.filter((p) => p !== playerId);
			if (current.length >= game.maxPlayers) return current;
			return [...current, playerId];
		});
	};

	const canStart = selectedIds.length >= game.minPlayers;

	const startGame = () => {
		startNewSession(game.id, selectedIds);
		router.push(`/jeux/play/${game.categories[0].id}`);
	};

	const confirmArchive = () => {
		Alert.alert(
			"Archiver ce jeu ?",
			"Il disparaîtra de la liste, mais son historique reste consultable.",
			[
				{ text: "Annuler", style: "cancel" },
				{ text: "Archiver", style: "destructive", onPress: () => toggleArchived(game.id) },
			],
		);
	};

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.name}>{game.name}</Text>
				<Text style={styles.meta}>
					{game.minPlayers === game.maxPlayers
						? `${game.minPlayers} joueur${game.minPlayers > 1 ? "s" : ""}`
						: `${game.minPlayers}–${game.maxPlayers} joueurs`}
				</Text>

				<View style={styles.chipsRow}>
					{game.categories.map((c) => (
						<View key={c.id} style={[styles.chip, { borderColor: c.color }]}>
							<Text style={[styles.chipLabel, { color: c.color }]}>{c.label}</Text>
						</View>
					))}
				</View>

				{otherGameOngoing ? (
					<>
						<Text style={styles.hint}>
							Une partie est en cours sur un autre jeu. Termine-la ou abandonne-la avant d'en lancer
							une ici.
						</Text>
						<Button label="Abandonner l'autre partie" variant="ghost" onPress={confirmAbandon} />
					</>
				) : isThisGameOngoing ? (
					<>
						<Button label="Reprendre la partie en cours" onPress={resume} />
						<Button label="Abandonner la partie" variant="ghost" onPress={confirmAbandon} />
					</>
				) : (
					<>
						<Text style={styles.sectionTitle}>
							Joueurs ({selectedIds.length}/{game.maxPlayers})
						</Text>
						<View style={styles.grid}>
							{activePlayers.map((player) => (
								<SelectablePlayerCard
									key={player.id}
									playerId={player.id}
									name={player.name}
									avatarUri={player.avatarUri}
									isFavorite={player.isFavorite}
									selected={selectedIds.includes(player.id)}
									onPress={() => toggleSelected(player.id)}
								/>
							))}
						</View>
						{activePlayers.length === 0 && (
							<Text style={styles.hint}>
								Aucun joueur disponible. Crée d'abord des joueurs dans l'onglet Joueurs.
							</Text>
						)}
						<Button label="Lancer une partie" disabled={!canStart} onPress={startGame} />
					</>
				)}

				{sessions.length > 0 && (
					<>
						<Text style={styles.sectionTitle}>Historique</Text>
						{sessions.map((session) => (
							<SessionSummaryCard
								key={session.id}
								session={session}
								game={game}
								players={players}
								showGameName={false}
								onPress={() => router.push(`/history/${session.id}`)}
							/>
						))}
					</>
				)}

				<Button
					label="Modifier"
					variant="secondary"
					onPress={() => router.push(`/jeux/${game.id}/edit`)}
					disabled={isThisGameOngoing}
				/>
				<Button
					label="Archiver"
					variant="ghost"
					onPress={confirmArchive}
					disabled={isThisGameOngoing}
				/>
			</ScrollView>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.sm,
					padding: SPACING.md,
				},
				name: {
					color: colors.text,
					fontSize: 22,
					fontWeight: "800",
				},
				meta: {
					color: colors.textMuted,
					fontSize: 13,
				},
				chipsRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.sm,
					marginVertical: SPACING.sm,
				},
				chip: {
					paddingVertical: 4,
					paddingHorizontal: SPACING.sm,
					borderRadius: RADIUS.full,
					borderWidth: 1.5,
				},
				chipLabel: {
					fontSize: 12,
					fontWeight: "600",
				},
				sectionTitle: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
					marginTop: SPACING.sm,
				},
				grid: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.sm,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
