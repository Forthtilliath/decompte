import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { SessionSummaryCard } from "@/components/history/SessionSummaryCard";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";

export default function HistoryScreen() {
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const sessions = useHistoryStore((s) => s.sessions);
	const games = useGamesStore((s) => s.games);
	const players = usePlayersStore((s) => s.players);
	const [query, setQuery] = useState("");

	// Recherche par nom de jeu ou de joueur ayant participé à la partie.
	const needle = query.trim().toLowerCase();
	const filteredSessions = useMemo(() => {
		if (needle.length === 0) return sessions;
		return sessions.filter((session) => {
			const game = games.find((g) => g.id === session.gameDefId);
			if (game?.name.toLowerCase().includes(needle)) return true;
			return session.playerIds.some((id) =>
				players
					.find((p) => p.id === id)
					?.name.toLowerCase()
					.includes(needle),
			);
		});
	}, [sessions, games, players, needle]);

	return (
		<ScreenContainer>
			{sessions.length > 0 && (
				<TextField
					placeholder="Rechercher par jeu ou joueur..."
					value={query}
					onChangeText={setQuery}
					style={styles.search}
					autoCapitalize="none"
				/>
			)}
			<FlatList
				data={filteredSessions}
				keyExtractor={(s) => s.id}
				contentContainerStyle={styles.list}
				ItemSeparatorComponent={() => <View style={styles.separator} />}
				ListEmptyComponent={
					<Text style={styles.empty}>
						{needle.length > 0
							? "Aucune partie ne correspond à cette recherche."
							: "Aucune partie enregistrée pour l'instant."}
					</Text>
				}
				renderItem={({ item }) => (
					<SessionSummaryCard
						session={item}
						game={games.find((g) => g.id === item.gameDefId)}
						players={players}
						onPress={() => router.push(`/history/${item.id}`)}
					/>
				)}
			/>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				search: {
					marginBottom: SPACING.md,
				},
				list: {
					paddingBottom: SPACING.md,
				},
				separator: {
					height: SPACING.sm,
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
