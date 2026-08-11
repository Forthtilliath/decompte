import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { rankEntries } from "@/lib/scoring";
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

	const ranking = useMemo(
		() => rankEntries(playerIds.map((id) => entries[id]).filter(Boolean)),
		[playerIds, entries],
	);

	if (!game || playerIds.length === 0) return null;

	const correctGame = () => {
		router.dismissTo(`/jeux/play/${game.categories[0].id}`);
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
				{ranking.map((entry) => {
					const player = allPlayers.find((p) => p.id === entry.playerId);
					if (!player) return null;
					return (
						<View key={entry.playerId} style={[styles.row, entry.rank === 1 && styles.rowFirst]}>
							<Text style={styles.rank}>{entry.rank}</Text>
							<PlayerAvatar name={player.name} avatarUri={player.avatarUri} seed={player.id} />
							<Text style={styles.name} numberOfLines={1}>
								{player.name}
							</Text>
							<Text style={styles.total}>{entry.total}</Text>
						</View>
					);
				})}
			</ScrollView>
			<Button label="Terminer et enregistrer la partie" onPress={confirmFinish} />
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
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					borderWidth: 1,
					borderColor: "transparent",
				},
				rowFirst: {
					borderColor: colors.gold,
				},
				rank: {
					color: colors.textMuted,
					fontSize: 16,
					fontWeight: "800",
					width: 24,
					textAlign: "center",
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 16,
					fontWeight: "700",
				},
				total: {
					color: colors.gold,
					fontSize: 20,
					fontWeight: "800",
				},
			}),
		[colors],
	);
}
