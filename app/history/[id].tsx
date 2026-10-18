import { confirmDestructive } from "@forthtilliath/react-native-kit/utils/helpers/confirmDestructive";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { RankedPlayerCard } from "@/components/scoring/RankedPlayerCard";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/lib/date";
import { rankEntries } from "@/lib/scoring";
import { getReplayPlan } from "@/lib/sessionFlow";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

export default function SessionDetailScreen() {
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const { id } = useLocalSearchParams<{ id: string }>();
	const session = useHistoryStore((s) => s.sessions.find((sess) => sess.id === id));
	const removeSession = useHistoryStore((s) => s.removeSession);
	const game = useGamesStore((s) => s.games.find((g) => g.id === session?.gameDefId));
	const players = usePlayersStore((s) => s.players);
	const hasOngoingSession = useSessionStore((s) => s.hasOngoingSession());
	const startNewSession = useSessionStore((s) => s.startNewSession);

	const ranking = useMemo(
		() => (session ? rankEntries(Object.values(session.entries)) : []),
		[session],
	);

	if (!session) {
		return (
			<ScreenContainer edges={["bottom", "left", "right"]}>
				<Text style={styles.empty}>Partie introuvable.</Text>
			</ScreenContainer>
		);
	}

	const confirmDelete = () => {
		confirmDestructive(
			"Supprimer cette partie ?",
			() => {
				removeSession(session.id);
				router.back();
			},
			{ message: "Elle disparaîtra de l'historique. C'est irréversible." },
		);
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

		const start = () => {
			startNewSession(game.id, plan.playerIds);
			router.push(`/jeux/play/${game.categories[0].id}`);
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
						/>
					);
				})}
			</ScrollView>
			{game && !game.isArchived && (
				<Button
					label="Rejouer avec les mêmes joueurs"
					variant="secondary"
					onPress={replay}
					style={styles.replayButton}
				/>
			)}
			<Button label="Supprimer cette partie" variant="danger" onPress={confirmDelete} />
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
