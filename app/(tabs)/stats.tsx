import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { GamesSection } from "@/components/stats/GamesSection";
import { PlayerStatsSection } from "@/components/stats/PlayerStatsSection";
import { RankingRow } from "@/components/stats/RankingRow";
import { RecordsSection } from "@/components/stats/RecordsSection";
import { ScoreTable } from "@/components/stats/ScoreTable";
import { StatsFiltersSheet } from "@/components/stats/StatsFiltersSheet";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { indexById } from "@/lib/byId";
import { plural } from "@/lib/plural";
import {
	computeGlobalRecords,
	computePlayerLeaderboard,
	computePlayerStats,
	formatRate,
} from "@/lib/stats";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";

type ViewMode = "graph" | "table";
type PickerTarget = null | "filters" | "compare";

export default function StatsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const sessions = useHistoryStore((s) => s.sessions);
	const games = useGamesStore((s) => s.games);
	const players = usePlayersStore((s) => s.players);

	const [viewMode, setViewMode] = useState<ViewMode>("graph");
	const [gameId, setGameId] = useState<string | undefined>();
	const [selectedId, setSelectedId] = useState<string | undefined>();
	const [compareId, setCompareId] = useState<string | undefined>();
	const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);

	const playedGames = useMemo(
		() =>
			games
				.filter((g) => sessions.some((s) => s.gameDefId === g.id))
				.sort((a, b) => a.name.localeCompare(b.name, "fr")),
		[games, sessions],
	);
	// Une sélection qui ne correspond plus à rien (partie supprimée, import) retombe sur « tous ».
	const game = playedGames.find((g) => g.id === gameId);

	const filteredSessions = useMemo(
		() => (game ? sessions.filter((s) => s.gameDefId === game.id) : sessions),
		[sessions, game],
	);
	const playersWithSessions = useMemo(
		() => players.filter((p) => filteredSessions.some((s) => s.playerIds.includes(p.id))),
		[players, filteredSessions],
	);
	const playersById = useMemo(() => indexById(playersWithSessions), [playersWithSessions]);
	const selectedPlayer = playersWithSessions.find((p) => p.id === selectedId);
	const comparePlayer = playersWithSessions.find(
		(p) => p.id === compareId && p.id !== selectedPlayer?.id,
	);

	const records = useMemo(() => computeGlobalRecords(filteredSessions), [filteredSessions]);
	const leaderboard = useMemo(
		() => computePlayerLeaderboard(filteredSessions, playersWithSessions),
		[filteredSessions, playersWithSessions],
	);
	const showTable = game !== undefined && viewMode === "table";
	// Seulement en vue tableau : la vue graphique calcule les stats du seul joueur affiché.
	const statsByPlayerId = useMemo(() => {
		if (!showTable) return {};
		return Object.fromEntries(
			playersWithSessions.map((p) => [
				p.id,
				computePlayerStats(p.id, filteredSessions, game.categories),
			]),
		);
	}, [showTable, playersWithSessions, filteredSessions, game]);

	if (sessions.length === 0) {
		return (
			<ScreenContainer>
				<Text style={styles.empty}>
					Aucune statistique pour l'instant : termine une partie pour voir apparaître les premières
					données.
				</Text>
			</ScreenContainer>
		);
	}

	return (
		<ScreenContainer>
			<ScrollView contentContainerStyle={styles.content}>
				<Button
					label={`Filtres · ${game?.name ?? "Tous les jeux"}`}
					variant="secondary"
					onPress={() => setPickerTarget("filters")}
				/>

				{game && (
					<RadioGroup
						options={[
							{ value: "graph", label: "Graphique" },
							{ value: "table", label: "Tableau" },
						]}
						value={viewMode}
						onChange={setViewMode}
					/>
				)}

				<RecordsSection
					records={records}
					players={players}
					games={games}
					singleGame={game !== undefined}
				/>

				{leaderboard.length > 0 && (
					<View style={styles.list}>
						<SectionTitle>Taux de victoire</SectionTitle>
						{leaderboard.map((entry, index) => {
							const player = playersById.get(entry.playerId);
							if (!player) return null;
							return (
								<RankingRow
									key={entry.playerId}
									rank={index + 1}
									leading={
										<PlayerAvatar
											name={player.name}
											avatarUri={player.avatarUri}
											seed={player.id}
											size={32}
										/>
									}
									title={player.name}
									meta={`${entry.wins} ${plural(entry.wins, "victoire")} sur ${entry.gamesPlayed} ${plural(entry.gamesPlayed, "partie")}`}
									value={formatRate(entry.winRate)}
									onPress={showTable ? undefined : () => setSelectedId(player.id)}
									selected={!showTable && player.id === selectedPlayer?.id}
								/>
							);
						})}
					</View>
				)}

				{showTable ? (
					<>
						<SectionTitle>Points moyens par catégorie</SectionTitle>
						<ScoreTable
							players={playersWithSessions}
							categories={game.categories}
							statsByPlayerId={statsByPlayerId}
						/>
					</>
				) : selectedPlayer ? (
					<>
						<PlayerStatsSection
							player={selectedPlayer}
							sessions={filteredSessions}
							game={game}
							games={games}
						/>
						{comparePlayer ? (
							<>
								<Button
									label="Retirer la comparaison"
									variant="ghost"
									onPress={() => setCompareId(undefined)}
								/>
								<View style={styles.divider} />
								<PlayerStatsSection
									player={comparePlayer}
									sessions={filteredSessions}
									game={game}
									games={games}
								/>
							</>
						) : (
							playersWithSessions.length > 1 && (
								<Button
									label="Comparer avec..."
									variant="secondary"
									onPress={() => setPickerTarget("compare")}
								/>
							)
						)}
					</>
				) : (
					<Text style={styles.hint}>Touche un joueur pour voir le détail de ses statistiques.</Text>
				)}

				{!game && <GamesSection sessions={sessions} games={games} onSelectGame={setGameId} />}
			</ScrollView>

			<StatsFiltersSheet
				visible={pickerTarget !== null}
				onClose={() => setPickerTarget(null)}
				games={pickerTarget === "filters" ? playedGames : undefined}
				selectedGameId={game?.id}
				onSelectGame={setGameId}
				// On ne compare pas un joueur à lui-même.
				players={
					pickerTarget === "compare"
						? playersWithSessions.filter((p) => p.id !== selectedPlayer?.id)
						: playersWithSessions
				}
				selectedPlayerId={pickerTarget === "compare" ? comparePlayer?.id : selectedPlayer?.id}
				onSelectPlayer={pickerTarget === "compare" ? setCompareId : setSelectedId}
				playerSectionTitle={pickerTarget === "compare" ? "Comparer avec" : "Joueur"}
			/>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.md,
					paddingBottom: SPACING.md,
				},
				list: {
					gap: SPACING.xs,
				},
				divider: {
					height: 1,
					backgroundColor: colors.border,
				},
				hint: {
					color: colors.textMuted,
					fontStyle: "italic",
					textAlign: "center",
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
