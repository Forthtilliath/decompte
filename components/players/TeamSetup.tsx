import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { RadioGroup } from "@/components/ui/RadioGroup";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { MIN_TEAMS, type TeamAssignment, teamName, teamOf } from "@/lib/teams";
import type { Player } from "@/types/player";

type Props = {
	/** Joueurs choisis, dans l'ordre de sélection. */
	players: Player[];
	teamCount: number;
	onTeamCountChange: (teamCount: number) => void;
	assignment: TeamAssignment;
	onAssign: (playerId: string, team: number) => void;
};

/** Composition des équipes au lancement d'un jeu en équipes : nombre d'équipes, puis l'équipe de
 * chaque joueur (à tour de rôle par défaut). */
export function TeamSetup({ players, teamCount, onTeamCountChange, assignment, onAssign }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const playerIds = players.map((p) => p.id);
	const options = Array.from({ length: teamCount }, (_, index) => ({
		value: String(index),
		label: teamName(index),
	}));

	return (
		<View style={styles.container}>
			<View style={styles.countRow}>
				<Text style={styles.title}>Équipes</Text>
				<NumberStepper
					value={teamCount}
					onChange={onTeamCountChange}
					min={MIN_TEAMS}
					max={Math.max(MIN_TEAMS, players.length)}
					label="Nombre d'équipes"
				/>
			</View>
			{players.map((player) => (
				<View key={player.id} style={styles.playerRow}>
					<Text style={styles.playerName} numberOfLines={1}>
						{player.name}
					</Text>
					<RadioGroup
						options={options}
						value={String(teamOf(assignment, playerIds, player.id, teamCount))}
						onChange={(value) => onAssign(player.id, Number(value))}
					/>
				</View>
			))}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.sm,
				},
				countRow: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				},
				title: {
					color: colors.text,
					fontSize: 16,
					fontWeight: "700",
				},
				playerRow: {
					gap: SPACING.xs,
				},
				playerName: {
					color: colors.text,
					fontSize: 14,
					fontWeight: "600",
				},
			}),
		[colors],
	);
}
