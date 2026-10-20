import { Ionicons } from "@expo/vector-icons";
import { shareTextFile } from "@forthtilliath/react-native-kit/utils/helpers/shareTextFile";
import { formatFileTimestamp } from "@forthtilliath/ts-kit/files/formatFileTimestamp";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
	Alert,
	FlatList,
	type ListRenderItemInfo,
	Pressable,
	StyleSheet,
	Text,
	View,
} from "react-native";
import { SessionSummaryCard } from "@/components/history/SessionSummaryCard";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { indexById } from "@/lib/byId";
import { buildHistoryCsv } from "@/lib/historyCsv";
import { matchesSearch, normalizeForSearch } from "@/lib/search";
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
	// `jeu` : ouvert depuis la fiche d'un jeu (« Voir les N parties »), limité à ses parties.
	const { jeu } = useLocalSearchParams<{ jeu?: string }>();
	const [query, setQuery] = useState("");
	const gamesById = useMemo(() => indexById(games), [games]);
	const playersById = useMemo(() => indexById(players), [players]);
	const filterGame = jeu ? gamesById.get(jeu) : undefined;

	// Recherche par nom de jeu ou de joueur ayant participé à la partie.
	const needle = normalizeForSearch(query);
	const filteredSessions = useMemo(() => {
		const ofGame = filterGame ? sessions.filter((s) => s.gameDefId === filterGame.id) : sessions;
		if (needle.length === 0) return ofGame;
		return ofGame.filter((session) => {
			if (matchesSearch(gamesById.get(session.gameDefId)?.name, needle)) return true;
			return session.playerIds.some((id) => matchesSearch(playersById.get(id)?.name, needle));
		});
	}, [sessions, filterGame, gamesById, playersById, needle]);
	const isFiltered = needle.length > 0 || filterGame !== undefined;

	// Les parties affichées (recherche et filtre compris), pour un tableur.
	const exportCsv = async () => {
		try {
			await shareTextFile(
				`decompte-historique-${formatFileTimestamp(new Date())}.csv`,
				buildHistoryCsv(filteredSessions, gamesById, playersById),
				{ mimeType: "text/csv", dialogTitle: "Exporter l'historique" },
			);
		} catch (error) {
			Alert.alert("Export impossible", error instanceof Error ? error.message : String(error));
		}
	};

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
				<View style={styles.toolbar}>
					<View style={styles.search}>
						<TextField
							placeholder="Rechercher par jeu ou joueur..."
							value={query}
							onChangeText={setQuery}
							autoCapitalize="none"
						/>
					</View>
					<Pressable
						onPress={exportCsv}
						disabled={filteredSessions.length === 0}
						hitSlop={8}
						accessibilityRole="button"
						accessibilityLabel="Exporter ces parties en CSV"
					>
						<Ionicons name="download-outline" size={26} color={colors.text} />
					</Pressable>
				</View>
			)}
			{filterGame && (
				<Pressable
					style={styles.filterChip}
					onPress={() => router.setParams({ jeu: undefined })}
					accessibilityRole="button"
					accessibilityLabel={`Retirer le filtre ${filterGame.name}`}
				>
					<Text style={styles.filterLabel}>{filterGame.name}</Text>
					<Ionicons name="close" size={16} color={colors.primaryText} />
				</Pressable>
			)}
			<FlatList
				data={filteredSessions}
				keyExtractor={(s) => s.id}
				contentContainerStyle={styles.list}
				ItemSeparatorComponent={Separator}
				ListEmptyComponent={
					<Text style={styles.empty}>
						{isFiltered
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
				toolbar: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					marginBottom: SPACING.md,
				},
				search: {
					flex: 1,
				},
				filterChip: {
					flexDirection: "row",
					alignItems: "center",
					alignSelf: "flex-start",
					gap: SPACING.xs,
					paddingVertical: 6,
					paddingHorizontal: SPACING.md,
					marginBottom: SPACING.md,
					borderRadius: RADIUS.full,
					backgroundColor: colors.primary,
				},
				filterLabel: {
					color: colors.primaryText,
					fontSize: 13,
					fontWeight: "600",
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
