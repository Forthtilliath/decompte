import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import { GameQrSheet } from "@/components/games/GameQrSheet";
import { SessionSummaryCard } from "@/components/history/SessionSummaryCard";
import { PlayerSelection } from "@/components/players/PlayerSelection";
import { TeamSetup } from "@/components/players/TeamSetup";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useOngoingSession } from "@/hooks/useOngoingSession";
import { indexById } from "@/lib/byId";
import { chipColors } from "@/lib/contrast";
import { parseGameExport, serializeGame } from "@/lib/gameExport";
import { getRoundCount } from "@/lib/rounds";
import { getFirstStepHref, getSessionSetup } from "@/lib/sessionFlow";
import { buildTeams, MIN_TEAMS, playersByTeam, type TeamAssignment } from "@/lib/teams";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useUndoStore } from "@/stores/undoStore";

/** Parties récentes affichées sur la fiche ; les autres sont dans l'onglet Historique. */
const RECENT_SESSIONS = 5;

export default function GameDetailScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const game = useGamesStore((s) => s.games.find((g) => g.id === id));
	const toggleArchived = useGamesStore((s) => s.toggleArchived);
	const offerUndo = useUndoStore((s) => s.offerUndo);
	const players = usePlayersStore((s) => s.players);
	const playersById = useMemo(() => indexById(players), [players]);
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
	const { hasOngoingSession, isOrphan, resume, confirmAbandon } = useOngoingSession();

	const [selectedIds, setSelectedIds] = useState<string[]>([]);
	const [teamCount, setTeamCount] = useState(MIN_TEAMS);
	const [assignment, setAssignment] = useState<TeamAssignment>({});
	const [qrText, setQrText] = useState<string | null>(null);

	if (!game) return null;

	const isThisGameOngoing = hasOngoingSession && sessionGameDefId === game.id;
	const otherGameOngoing = hasOngoingSession && sessionGameDefId !== game.id;

	const teams = game.teamPlay ? buildTeams(selectedIds, assignment, teamCount) : null;
	const canStart =
		selectedIds.length >= game.minPlayers && (teams === null || teams.length >= MIN_TEAMS);
	const roundCount = getRoundCount(game);
	const selectedPlayers = selectedIds
		.map((playerId) => playersById.get(playerId))
		.filter((p) => p !== undefined);

	const startGame = () => {
		// En équipes, la saisie suit les équipes : les coéquipiers se suivent.
		startNewSession(
			game.id,
			teams ? playersByTeam(teams) : selectedIds,
			getSessionSetup(game, teams),
		);
		router.push(getFirstStepHref(game));
	};

	/** Texte du jeu partagé, ou `null` (avec une alerte) s'il serait refusé à l'import. */
	const shareableText = () => {
		const text = serializeGame(game);
		// Un jeu créé avant les bornes d'import (libellé très long…) serait refusé chez le
		// destinataire : mieux vaut le dire ici que lui envoyer un texte inutilisable.
		const check = parseGameExport(text);
		if (!check.ok) {
			Alert.alert("Partage impossible", `${check.error} Modifie le jeu puis réessaie.`);
			return null;
		}
		return text;
	};

	const shareGame = () => {
		const text = shareableText();
		if (text) Share.share({ title: game.name, message: text });
	};

	const showQrCode = () => {
		const text = shareableText();
		if (text) setQrText(text);
	};

	// Archivage immédiat plutôt qu'une confirmation : la barre « Annuler » le rattrape, et c'est le
	// seul moyen de faire revenir un jeu archivé (il disparaît de la liste).
	const archive = () => {
		toggleArchived(game.id);
		offerUndo(`« ${game.name} » archivé`, () => toggleArchived(game.id));
		router.dismissTo("/jeux");
	};

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.name}>{game.name}</Text>
				<Text style={styles.meta}>
					{game.minPlayers === game.maxPlayers
						? `${game.minPlayers} joueur${game.minPlayers > 1 ? "s" : ""}`
						: `${game.minPlayers}–${game.maxPlayers} joueurs`}
					{roundCount > 1 && ` · ${roundCount} manches`}
					{game.teamPlay && " · en équipes"}
					{game.lowestWins && " · le plus bas gagne"}
				</Text>

				<View style={styles.chipsRow}>
					{game.categories.map((c) => {
						const { color, ...chip } = chipColors(c.color, colors.background);
						return (
							<View key={c.id} style={[styles.chip, chip]}>
								<Text style={[styles.chipLabel, { color }]}>{c.label}</Text>
							</View>
						);
					})}
				</View>

				{otherGameOngoing ? (
					<>
						<Text style={styles.hint}>
							{isOrphan
								? "Une partie est en cours sur un jeu qui n'existe plus sur ce téléphone : elle ne peut pas être reprise. Abandonne-la avant d'en lancer une ici."
								: "Une partie est en cours sur un autre jeu. Termine-la ou abandonne-la avant d'en lancer une ici."}
						</Text>
						<Button label="Abandonner l'autre partie" variant="ghost" onPress={confirmAbandon} />
					</>
				) : isThisGameOngoing ? (
					<>
						<Button label="Reprendre la partie en cours" variant="success" onPress={resume} />
						<Button label="Abandonner la partie" variant="ghost" onPress={confirmAbandon} />
					</>
				) : (
					<>
						<PlayerSelection
							maxPlayers={game.maxPlayers}
							selectedIds={selectedIds}
							onChange={setSelectedIds}
						/>
						{game.teamPlay && selectedPlayers.length >= MIN_TEAMS && (
							<TeamSetup
								players={selectedPlayers}
								teamCount={teamCount}
								onTeamCountChange={setTeamCount}
								assignment={assignment}
								onAssign={(playerId, team) =>
									setAssignment((current) => ({ ...current, [playerId]: team }))
								}
							/>
						)}
						<Button
							label="Lancer une partie"
							variant="success"
							disabled={!canStart}
							onPress={startGame}
						/>
					</>
				)}

				{sessions.length > 0 && (
					<>
						<Text style={styles.sectionTitle}>Historique</Text>
						{sessions.slice(0, RECENT_SESSIONS).map((session) => (
							<SessionSummaryCard
								key={session.id}
								session={session}
								game={game}
								playersById={playersById}
								showGameName={false}
								onPress={(sessionId) => router.push(`/history/${sessionId}`)}
							/>
						))}
						{sessions.length > RECENT_SESSIONS && (
							<Button
								label={`Voir les ${sessions.length} parties`}
								variant="ghost"
								onPress={() =>
									router.navigate({ pathname: "/historique", params: { jeu: game.id } })
								}
							/>
						)}
					</>
				)}

				<Button
					label="Modifier"
					variant="secondary"
					onPress={() => router.push(`/jeux/${game.id}/edit`)}
					disabled={isThisGameOngoing}
				/>
				<Button label="Partager" variant="secondary" onPress={shareGame} />
				<Button label="Afficher le QR code" variant="secondary" onPress={showQrCode} />
				<Button label="Archiver" variant="ghost" onPress={archive} disabled={isThisGameOngoing} />
			</ScrollView>
			<GameQrSheet visible={qrText !== null} onClose={() => setQrText(null)} text={qrText ?? ""} />
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
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
