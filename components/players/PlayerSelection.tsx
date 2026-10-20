import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SelectablePlayerCard } from "@/components/players/SelectablePlayerCard";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import {
	countPlays,
	isGroupSelected,
	sortForSelection,
	toggleGroupSelection,
	toggleSelection,
} from "@/lib/players";
import { selectSortedGroups, useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";

type Props = {
	maxPlayers: number;
	selectedIds: string[];
	onChange: (selectedIds: string[]) => void;
};

/** Choix des joueurs d'une partie : groupes en un geste, puis grille des joueurs un par un. */
export function PlayerSelection({ maxPlayers, selectedIds, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const players = usePlayersStore((s) => s.players);
	const groups = useGroupsStore((s) => s.groups);
	const sessions = useHistoryStore((s) => s.sessions);

	const activePlayers = useMemo(
		() =>
			sortForSelection(
				players.filter((p) => !p.isArchived),
				countPlays(sessions),
			),
		[players, sessions],
	);
	// Chaque groupe réduit à ses joueurs disponibles ; un groupe sans aucun n'est pas proposé.
	const groupChoices = useMemo(() => {
		const available = new Set(activePlayers.map((p) => p.id));
		return selectSortedGroups(groups.filter((g) => !g.isArchived))
			.map((group) => ({ group, ids: group.playerIds.filter((id) => available.has(id)) }))
			.filter(({ ids }) => ids.length > 0);
	}, [groups, activePlayers]);

	return (
		<>
			<Text style={styles.sectionTitle}>
				Joueurs ({selectedIds.length}/{maxPlayers})
			</Text>
			{groupChoices.length > 0 && (
				<View style={styles.groupsRow}>
					{groupChoices.map(({ group, ids }) => {
						const selected = isGroupSelected(selectedIds, ids);
						return (
							<Pressable
								key={group.id}
								style={[styles.groupChip, selected && styles.groupChipSelected]}
								onPress={() => {
									selectFeedback();
									onChange(toggleGroupSelection(selectedIds, ids, maxPlayers));
								}}
								accessibilityRole="checkbox"
								accessibilityState={{ checked: selected }}
								accessibilityLabel={`Groupe ${group.name}, ${ids.length} joueur${ids.length > 1 ? "s" : ""}`}
							>
								<Ionicons
									name="people"
									size={14}
									color={selected ? colors.primaryText : colors.textMuted}
								/>
								<Text style={[styles.groupLabel, selected && styles.groupLabelSelected]}>
									{group.name}
								</Text>
							</Pressable>
						);
					})}
				</View>
			)}
			<View style={styles.grid}>
				{activePlayers.map((player) => (
					<SelectablePlayerCard
						key={player.id}
						playerId={player.id}
						name={player.name}
						avatarUri={player.avatarUri}
						isFavorite={player.isFavorite}
						selected={selectedIds.includes(player.id)}
						order={selectedIds.indexOf(player.id) + 1}
						onPress={() => onChange(toggleSelection(selectedIds, player.id, maxPlayers))}
					/>
				))}
			</View>
			{selectedIds.length > 1 && (
				<Text style={styles.hint}>
					Les joueurs jouent dans l'ordre où tu les coches. Tu pourras le changer pendant la partie.
				</Text>
			)}
			{activePlayers.length === 0 && (
				<Text style={styles.hint}>
					Aucun joueur disponible. Crée d'abord des joueurs dans l'onglet Joueurs.
				</Text>
			)}
		</>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				sectionTitle: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
					marginTop: SPACING.sm,
				},
				groupsRow: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.sm,
				},
				groupChip: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.xs,
					paddingVertical: 6,
					paddingHorizontal: SPACING.md,
					borderRadius: RADIUS.full,
					borderWidth: 1.5,
					borderColor: colors.border,
					backgroundColor: colors.surface,
				},
				groupChipSelected: {
					borderColor: colors.primary,
					backgroundColor: colors.primary,
				},
				groupLabel: {
					color: colors.text,
					fontSize: 13,
					fontWeight: "600",
				},
				groupLabelSelected: {
					color: colors.primaryText,
				},
				grid: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.sm,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
