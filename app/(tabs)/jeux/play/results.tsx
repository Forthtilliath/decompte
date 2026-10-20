import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { MissingScoresNotice } from "@/components/scoring/MissingScoresNotice";
import { RankedPlayerCard } from "@/components/scoring/RankedPlayerCard";
import { TeamRankingCard } from "@/components/scoring/TeamRankingCard";
import { GameCharts } from "@/components/stats/GameCharts";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { indexById } from "@/lib/byId";
import { getRoundCount } from "@/lib/rounds";
import { rankSession } from "@/lib/scoring";
import { getFirstStepHref, getMissingSteps, getStepHref } from "@/lib/sessionFlow";
import { useGamesStore } from "@/stores/gamesStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

export default function ResultsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const gameDefId = useSessionStore((s) => s.gameDefId);
	const playerIds = useSessionStore((s) => s.playerIds);
	const entries = useSessionStore((s) => s.entries);
	const finishSession = useSessionStore((s) => s.finishSession);
	const game = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));
	const allPlayers = usePlayersStore((s) => s.players);
	const [chartsVisible, setChartsVisible] = useState(false);
	// Le téléphone posé sur la table pendant qu'on commente le classement ne doit pas se verrouiller.
	useKeepAwake();

	const lowestWins = useSessionStore((s) => s.lowestWins);
	const tieBreakerId = useSessionStore((s) => s.tieBreakerId);
	const teams = useSessionStore((s) => s.teams);
	const { players: ranking, teams: teamRanking } = useMemo(
		() =>
			rankSession({
				playerIds,
				entries,
				lowestWins,
				tieBreakerId: tieBreakerId ?? undefined,
				teams: teams ?? undefined,
			}),
		[playerIds, entries, lowestWins, tieBreakerId, teams],
	);
	const playersById = useMemo(() => indexById(allPlayers), [allPlayers]);
	const missingSteps = useMemo(
		() => (game ? getMissingSteps(game, playerIds, entries) : []),
		[game, playerIds, entries],
	);

	if (!game || playerIds.length === 0) return null;

	const correctGame = () => {
		router.dismissTo(getFirstStepHref(game));
	};

	const confirmFinish = () => {
		finishSession();
		router.dismissTo("/jeux");
	};

	return (
		<ScreenContainer>
			<Stack.Screen
				options={{
					headerRight: () => (
						<Pressable
							onPress={correctGame}
							hitSlop={12}
							accessibilityRole="button"
							accessibilityLabel="Corriger la partie"
						>
							<Ionicons name="arrow-undo-outline" size={24} color={colors.text} />
						</Pressable>
					),
				}}
			/>
			<Text style={styles.title}>Classement</Text>
			<ScrollView contentContainerStyle={styles.list}>
				<MissingScoresNotice
					steps={missingSteps}
					categories={game.categories}
					players={playersById}
					roundCount={getRoundCount(game)}
					onOpen={(step) => router.dismissTo(getStepHref(step))}
				/>
				{teamRanking?.map((team) => (
					<TeamRankingCard key={team.teamId} team={team} playersById={playersById} />
				))}
				{ranking.map((ranked) => {
					const player = allPlayers.find((p) => p.id === ranked.playerId);
					const entry = entries[ranked.playerId];
					if (!entry) return null;
					return (
						<RankedPlayerCard
							key={ranked.playerId}
							player={player}
							ranked={ranked}
							entry={entry}
							categories={game.categories}
							roundCount={getRoundCount(game)}
						/>
					);
				})}
				<Button
					label={chartsVisible ? "Masquer les graphiques" : "Voir les graphiques"}
					variant="ghost"
					onPress={() => setChartsVisible((visible) => !visible)}
				/>
				{chartsVisible && (
					<GameCharts
						categories={game.categories}
						ranking={ranking}
						entries={entries}
						players={allPlayers}
					/>
				)}
			</ScrollView>
			<Button label="Terminer et enregistrer la partie" variant="success" onPress={confirmFinish} />
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				title: {
					color: colors.text,
					fontSize: 22,
					fontWeight: "800",
					marginBottom: SPACING.md,
				},
				list: {
					gap: SPACING.sm,
					paddingBottom: SPACING.md,
				},
			}),
		[colors],
	);
}
