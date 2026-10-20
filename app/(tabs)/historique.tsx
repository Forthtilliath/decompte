import { useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, type ListRenderItemInfo, StyleSheet, Text, View } from "react-native";
import { SessionSummaryCard } from "@/components/history/SessionSummaryCard";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { indexById } from "@/lib/byId";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import type { Session } from "@/types/game";

export default function HistoryScreen() {
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const sessions = useHistoryStore((s) => s.sessions);
	const games = useGamesStore((s) => s.games);
	const players = usePlayersStore((s) => s.players);
	const [query, setQuery] = useState("");
	const gamesById = useMemo(() => indexById(games), [games]);
	const playersById = useMemo(() => indexById(players), [players]);

	// Recherche par nom de jeu ou de joueur ayant participé à la partie.
	const needle = query.trim().toLowerCase();
	const filteredSessions = useMemo(() => {
		if (needle.length === 0) return sessions;
		return sessions.filter((session) => {
			if (gamesById.get(session.gameDefId)?.name.toLowerCase().includes(needle)) return true;
			return session.playerIds.some((id) =>
				playersById.get(id)?.name.toLowerCase().includes(needle),
			);
		});
	}, [sessions, gamesById, playersById, needle]);

	const openSession = useCallback(
		(sessionId: string) => router.push(`/history/${sessionId}`),
		[router],
	);
	const renderItem = useCallback(
		({ item }: ListRenderItemInfo<Session>) => (
			<SessionSummaryCard
				session={item}
				game={gamesById.get(item.gameDefId)}
				playersById={playersById}
				onPress={openSession}
			/>
		),
		[gamesById, playersById, openSession],
	);

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
				ItemSeparatorComponent={Separator}
				ListEmptyComponent={
					<Text style={styles.empty}>
						{needle.length > 0
							? "Aucune partie ne correspond à cette recherche."
							: "Aucune partie enregistrée pour l'instant."}
					</Text>
				}
				renderItem={renderItem}
				// Hauteur variable (les joueurs passent à la ligne) : pas de getItemLayout. Une fenêtre
				// plus étroite que la valeur par défaut (21 écrans) garde peu de cartes montées quand
				// l'historique compte des centaines de parties.
				initialNumToRender={8}
				maxToRenderPerBatch={8}
				windowSize={7}
			/>
		</ScreenContainer>
	);
}

// Composant défini hors du rendu : une fonction recréée à chaque rendu remonterait chaque séparateur.
function Separator() {
	return <View style={separatorStyle} />;
}

const separatorStyle = { height: SPACING.sm };

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
				empty: {
					color: colors.textMuted,
					textAlign: "center",
					marginTop: SPACING.lg,
				},
			}),
		[colors],
	);
}
