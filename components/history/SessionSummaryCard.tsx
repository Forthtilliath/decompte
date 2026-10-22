import { memo, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { formatRank, RANK_MEDALS } from "@/constants/ranking";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/lib/date";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { getSessionRanking } from "@/lib/stats";
import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	session: Session;
	game: GameDef | undefined;
	/** Tous les joueurs par id (`indexById`) : une lecture par joueur plutôt qu'une recherche. */
	playersById: ReadonlyMap<string, Player>;
	/** Reçoit l'id de la partie : un seul callback stable pour toute la liste, sans casser `memo`. */
	onPress: (sessionId: string) => void;
	/** Masqué sur la fiche d'un jeu, où le nom du jeu est déjà en titre. */
	showGameName?: boolean;
};

/** Résumé d'une partie terminée : jeu, date, et joueurs dans l'ordre du classement. Mémoïsé : la
 * liste de l'historique ne redessine que les cartes dont la partie, le jeu ou les joueurs changent. */
export const SessionSummaryCard = memo(function SessionSummaryCard({
	session,
	game,
	playersById,
	onPress,
	showGameName = true,
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const ranking = getSessionRanking(session);
	// Lu après le libellé du bouton : ce que la carte affiche (jeu, classement).
	const summary = [
		...(showGameName ? [game?.name ?? "Jeu introuvable"] : []),
		...ranking.map(
			(score) =>
				`${formatRank(score.rank)} ${playersById.get(score.playerId)?.name ?? DELETED_PLAYER_LABEL}, ${score.total} points`,
		),
	].join(" ; ");

	return (
		<Pressable
			style={({ pressed }) => [styles.card, pressed && styles.pressed]}
			onPress={() => onPress(session.id)}
			accessibilityRole="button"
			accessibilityLabel={`Voir le détail de la partie du ${formatDate(session.createdAt)}`}
			accessibilityValue={{ text: summary }}
		>
			<View style={styles.row}>
				{showGameName && (
					<Text style={styles.gameName} numberOfLines={1}>
						{game?.name ?? "Jeu introuvable"}
					</Text>
				)}
				<Text style={styles.date}>
					{formatDate(session.createdAt)}
					{(session.notes || session.photoUri) && " · "}
					{session.notes && "📝"}
					{session.photoUri && "📷"}
				</Text>
			</View>

			<View style={styles.playersRow}>
				{ranking.map((score) => {
					// Un joueur supprimé depuis reste affiché (anonymisé) : le retirer fausserait le classement.
					const player = playersById.get(score.playerId);
					return (
						<View key={score.playerId} style={styles.player}>
							<PlayerAvatar
								name={player?.name ?? "?"}
								avatarUri={player?.avatarUri}
								seed={score.playerId}
								size={36}
							/>
							<Text style={[styles.playerName, !player && styles.deletedName]} numberOfLines={1}>
								{player?.name ?? DELETED_PLAYER_LABEL}
							</Text>
							<Text style={[styles.playerScore, score.rank === 1 && styles.winnerScore]}>
								{RANK_MEDALS[score.rank] ?? formatRank(score.rank)} {score.total}
							</Text>
						</View>
					);
				})}
			</View>
		</Pressable>
	);
});

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.sm,
					...colors.decor.card,
				},
				pressed: {
					opacity: 0.7,
				},
				row: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					gap: SPACING.sm,
				},
				gameName: {
					flex: 1,
					color: colors.text,
					fontSize: 16,
					fontWeight: "700",
				},
				date: {
					color: colors.textMuted,
					fontSize: 13,
				},
				playersRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.sm,
				},
				player: {
					width: 52,
					alignItems: "center",
					gap: 2,
				},
				playerName: {
					color: colors.text,
					fontSize: 11,
					fontWeight: "600",
				},
				deletedName: {
					color: colors.textMuted,
					fontStyle: "italic",
				},
				playerScore: {
					color: colors.textMuted,
					fontSize: 11,
					fontVariant: ["tabular-nums"],
				},
				winnerScore: {
					color: colors.gold,
					fontWeight: "700",
				},
			}),
		[colors],
	);
}
