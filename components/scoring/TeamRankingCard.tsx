import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { RANK_MEDALS } from "@/constants/ranking";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import type { RankedTeam } from "@/lib/scoring";
import type { Player } from "@/types/player";

type Props = {
	team: RankedTeam;
	/** Tous les joueurs par id : un joueur supprimé depuis reste compté, sous un nom anonyme. */
	playersById: ReadonlyMap<string, Player>;
};

/** Ligne du classement des équipes : rang, nom, joueurs et total de l'équipe. */
export function TeamRankingCard({ team, playersById }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const members = team.playerIds
		.map((id) => playersById.get(id)?.name ?? DELETED_PLAYER_LABEL)
		.join(", ");

	return (
		<View
			style={[styles.card, team.rank === 1 && styles.cardWinner]}
			accessible
			accessibilityLabel={`${team.rank}e, ${team.name}, ${team.total} points : ${members}`}
		>
			<Text style={styles.rank}>{RANK_MEDALS[team.rank] ?? `#${team.rank}`}</Text>
			<View style={styles.body}>
				<Text style={styles.name} numberOfLines={1}>
					{team.name}
				</Text>
				<Text style={styles.members} numberOfLines={2}>
					{members}
				</Text>
			</View>
			<Text style={styles.total}>{team.total}</Text>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					borderWidth: 1.5,
					borderColor: "transparent",
				},
				cardWinner: {
					borderColor: colors.gold,
				},
				rank: {
					color: colors.textMuted,
					fontSize: 20,
					fontWeight: "800",
					width: 32,
					textAlign: "center",
				},
				body: {
					flex: 1,
					gap: 2,
				},
				name: {
					color: colors.text,
					fontSize: 17,
					fontWeight: "700",
				},
				members: {
					color: colors.textMuted,
					fontSize: 13,
				},
				total: {
					color: colors.gold,
					fontSize: 22,
					fontWeight: "800",
				},
			}),
		[colors],
	);
}
