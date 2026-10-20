import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { RankedPlayerCard } from "@/components/scoring/RankedPlayerCard";
import { TeamRankingCard } from "@/components/scoring/TeamRankingCard";
import { GameCharts } from "@/components/stats/GameCharts";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { indexById } from "@/lib/byId";
import { formatDate } from "@/lib/date";
import { getRoundCount } from "@/lib/rounds";
import { getFirstStepHref, getReplayPlan, getSessionSetup } from "@/lib/sessionFlow";
import { getFullSessionRanking } from "@/lib/stats";
import { replayTeams } from "@/lib/teams";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUndoStore } from "@/stores/undoStore";

export default function SessionDetailScreen() {
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const { id } = useLocalSearchParams<{ id: string }>();
	const session = useHistoryStore((s) => s.sessions.find((sess) => sess.id === id));
	const removeSession = useHistoryStore((s) => s.removeSession);
	const restoreSession = useHistoryStore((s) => s.restoreSession);
	const offerUndo = useUndoStore((s) => s.offerUndo);
	const game = useGamesStore((s) => s.games.find((g) => g.id === session?.gameDefId));
	const players = usePlayersStore((s) => s.players);
	const hasOngoingSession = useSessionStore((s) => s.hasOngoingSession());
	const startNewSession = useSessionStore((s) => s.startNewSession);
	const [chartsVisible, setChartsVisible] = useState(false);

	const playersById = useMemo(() => indexById(players), [players]);
	const { players: ranking, teams: teamRanking } = useMemo(
		() => (session ? getFullSessionRanking(session) : { players: [], teams: null }),
		[session],
	);

	if (!session) {
		return (
			<ScreenContainer edges={["bottom", "left", "right"]}>
				<Text style={styles.empty}>Partie introuvable.</Text>
			</ScreenContainer>
		);
	}

	// Suppression immédiate plutôt qu'une confirmation : la barre « Annuler » la rattrape.
	const deleteSession = () => {
		const index = useHistoryStore.getState().sessions.indexOf(session);
		removeSession(session.id);
		offerUndo("Partie supprimée", () => restoreSession(session, index));
		router.back();
	};

	const replay = () => {
		if (!game) return;
		if (hasOngoingSession) {
			Alert.alert(
				"Une partie est déjà en cours",
				"Termine-la ou abandonne-la depuis l'onglet Jeux avant d'en lancer une nouvelle.",
			);
			return;
		}

		const plan = getReplayPlan(session, game, players);
		if (!plan.ok) {
			Alert.alert("Impossible de rejouer", plan.reason);
			return;
		}

		// Jeu en équipes : mêmes équipes, sans les joueurs indisponibles.
		const teams = game.teamPlay ? replayTeams(session.teams, plan.playerIds) : null;
		if (game.teamPlay && !teams) {
			Alert.alert(
				"Impossible de rejouer",
				"Les équipes de cette partie ne sont plus complètes : lance la partie depuis la fiche du jeu pour les recomposer.",
			);
			return;
		}

		const start = () => {
			startNewSession(game.id, plan.playerIds, getSessionSetup(game, teams));
			router.push(getFirstStepHref(game));
		};

		if (plan.isPartial) {
			Alert.alert(
				"Certains joueurs ne sont plus disponibles",
				"La partie démarrera uniquement avec les joueurs restants.",
				[
					{ text: "Annuler", style: "cancel" },
					{ text: "Continuer", onPress: start },
				],
			);
			return;
		}
		start();
	};

	return (
		<ScreenContainer edges={["bottom", "left", "right"]}>
			<Stack.Screen options={{ title: game?.name ?? "Détail de la partie" }} />
			<Text style={styles.date}>{formatDate(session.createdAt)}</Text>
			<ScrollView contentContainerStyle={styles.list}>
				{teamRanking?.map((team) => (
					<TeamRankingCard key={team.teamId} team={team} playersById={playersById} />
				))}
				{ranking.map((ranked) => {
					const player = players.find((p) => p.id === ranked.playerId);
					const entry = session.entries[ranked.playerId];
					if (!entry) return null;
					return (
						<RankedPlayerCard
							key={ranked.playerId}
							player={player}
							ranked={ranked}
							entry={entry}
							categories={game?.categories ?? []}
							roundCount={game ? getRoundCount(game) : 1}
						/>
					);
				})}
				{game && (
					<>
						<Button
							label={chartsVisible ? "Masquer les graphiques" : "Voir les graphiques"}
							variant="ghost"
							onPress={() => setChartsVisible((visible) => !visible)}
						/>
						{chartsVisible && (
							<GameCharts
								categories={game.categories}
								ranking={ranking}
								entries={session.entries}
								players={players}
							/>
						)}
					</>
				)}
			</ScrollView>
			{game && !game.isArchived && (
				<Button
					label="Rejouer avec les mêmes joueurs"
					variant="secondary"
					onPress={replay}
					style={styles.replayButton}
				/>
			)}
			<Button label="Supprimer cette partie" variant="danger" onPress={deleteSession} />
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				date: {
					color: colors.textMuted,
					fontSize: 13,
					marginBottom: SPACING.sm,
				},
				list: {
					gap: SPACING.sm,
					paddingBottom: SPACING.md,
				},
				replayButton: {
					marginBottom: SPACING.sm,
				},
				empty: {
					color: colors.textMuted,
					textAlign: "center",
					marginTop: SPACING.xl,
				},
			}),
		[colors],
	);
}
