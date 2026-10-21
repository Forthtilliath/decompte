import { indexById } from "@forthtilliath/ts-kit/array/indexById";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { RoundRecapRow } from "@/components/scoring/RoundRecapRow";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { MAX_OPEN_ROUNDS } from "@/lib/gameLimits";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { getRoundRecap } from "@/lib/roundRecap";
import { getLastScoredRound, getScoreLimitReachers } from "@/lib/rounds";
import { rankSession } from "@/lib/scoring";
import { getRoundStartHref } from "@/lib/sessionFlow";
import { useGamesStore } from "@/stores/gamesStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

/**
 * Fin d'une manche d'une partie en manches ouvertes (Odin, Skyjo…) : totaux cumulés, puis manche
 * suivante ou fin de la partie. Un seuil atteint termine la partie à la fin de sa manche.
 */
export default function RoundEndScreen() {
	const params = useLocalSearchParams<{ round?: string }>();
	const round = Number(params.round) || 1;
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const gameDefId = useSessionStore((s) => s.gameDefId);
	const playerIds = useSessionStore((s) => s.playerIds);
	const entries = useSessionStore((s) => s.entries);
	const lowestWins = useSessionStore((s) => s.lowestWins);
	const tieBreakerId = useSessionStore((s) => s.tieBreakerId);
	const teams = useSessionStore((s) => s.teams);
	const scoreLimit = useSessionStore((s) => s.openRounds?.scoreLimit);
	const roundCount = useSessionStore((s) => s.roundCount ?? 1);
	const setRoundCount = useSessionStore((s) => s.setRoundCount);
	const game = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));
	const allPlayers = usePlayersStore((s) => s.players);
	// Le téléphone reste posé sur la table pendant qu'on commente les totaux.
	useKeepAwake();

	const lines = useMemo(() => {
		const playersById = indexById(allPlayers);
		const ranking = rankSession({
			playerIds,
			entries,
			lowestWins,
			tieBreakerId: tieBreakerId ?? undefined,
			teams: teams ?? undefined,
		});
		const nameOf = (id: string) => playersById.get(id)?.name ?? DELETED_PLAYER_LABEL;
		return getRoundRecap(ranking, entries, round, nameOf);
	}, [allPlayers, playerIds, entries, lowestWins, tieBreakerId, teams, round]);

	if (!game || playerIds.length === 0) return null;

	const reachers = getScoreLimitReachers(lines, scoreLimit);
	const isOver = reachers.length > 0;
	// Revenu ici depuis une manche suivante déjà saisie : la partie ne peut plus s'arrêter avant elle.
	const hasLaterScores = getLastScoredRound(Object.values(entries)) > round;
	const nextRound = round + 1;
	const canContinue = nextRound <= MAX_OPEN_ROUNDS;

	const startNextRound = () => {
		setRoundCount(Math.max(roundCount, nextRound));
		router.push(getRoundStartHref(game, nextRound));
	};

	// Une manche suivante ouverte puis laissée vide ne compte pas : elle manquerait aux résultats.
	const showResults = () => {
		if (!hasLaterScores) setRoundCount(round);
		router.push("/jeux/play/results");
	};

	return (
		<ScreenContainer>
			<Stack.Screen options={{ title: `Fin de la manche ${round}` }} />
			<ScrollView contentContainerStyle={styles.list}>
				{isOver ? (
					<View style={styles.notice} accessibilityRole="alert">
						<Text style={styles.noticeText}>
							{reachers.map((r) => r.name).join(", ")}{" "}
							{reachers.length > 1 ? "atteignent" : "atteint"} {scoreLimit} points : la partie est
							terminée.
						</Text>
					</View>
				) : (
					scoreLimit !== undefined && (
						<Text style={styles.hint}>
							La partie s'arrête dès qu'un total atteint {scoreLimit}.
						</Text>
					)
				)}
				{lines.map((line) => (
					<RoundRecapRow key={line.id} line={line} scoreLimit={scoreLimit} />
				))}
				{!isOver && !canContinue && (
					<Text style={styles.hint}>
						Une partie compte {MAX_OPEN_ROUNDS} manches maximum : il est temps de conclure.
					</Text>
				)}
			</ScrollView>

			{isOver ? (
				<Button label="Voir le classement" variant="success" onPress={showResults} />
			) : (
				<View style={styles.actions}>
					<Button label={`Manche ${nextRound}`} onPress={startNextRound} disabled={!canContinue} />
					{!hasLaterScores && (
						<Button label="Terminer la partie" variant="ghost" onPress={showResults} />
					)}
				</View>
			)}
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				list: {
					gap: SPACING.sm,
					paddingBottom: SPACING.md,
				},
				notice: {
					borderRadius: RADIUS.md,
					borderWidth: 1.5,
					borderColor: colors.danger,
					padding: SPACING.md,
				},
				noticeText: {
					color: colors.text,
					fontSize: 15,
					fontWeight: "700",
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
				actions: {
					gap: SPACING.sm,
				},
			}),
		[colors],
	);
}
