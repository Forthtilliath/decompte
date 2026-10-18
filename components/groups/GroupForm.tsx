import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SelectablePlayerCard } from "@/components/players/SelectablePlayerCard";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { MAX_GROUP_SIZE } from "@/constants/players";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { toggleSelection } from "@/lib/players";
import { selectSortedPlayers, usePlayersStore } from "@/stores/playersStore";

type Props = {
	initialName?: string;
	initialPlayerIds?: string[];
	submitLabel: string;
	onSubmit: (values: { name: string; playerIds: string[] }) => void;
};

export function GroupForm({
	initialName = "",
	initialPlayerIds = [],
	submitLabel,
	onSubmit,
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const players = usePlayersStore((s) => s.players);
	const activePlayers = selectSortedPlayers(players.filter((p) => !p.isArchived));

	const [name, setName] = useState(initialName);
	const [selectedIds, setSelectedIds] = useState<string[]>(initialPlayerIds);

	const toggleSelected = (id: string) => {
		setSelectedIds((current) => toggleSelection(current, id, MAX_GROUP_SIZE));
	};

	const canSubmit = name.trim().length > 0 && selectedIds.length > 0;

	return (
		<View style={styles.container}>
			<TextField
				label="Nom du groupe"
				placeholder="Ex : Soirée jeudi"
				value={name}
				onChangeText={setName}
				autoFocus
			/>

			<Text style={styles.sectionTitle}>
				Membres ({selectedIds.length}/{MAX_GROUP_SIZE})
			</Text>
			<ScrollView style={styles.scroll} contentContainerStyle={styles.grid}>
				{activePlayers.map((player) => (
					<SelectablePlayerCard
						key={player.id}
						playerId={player.id}
						name={player.name}
						avatarUri={player.avatarUri}
						isFavorite={player.isFavorite}
						selected={selectedIds.includes(player.id)}
						onPress={() => toggleSelected(player.id)}
					/>
				))}
				{activePlayers.length === 0 && (
					<Text style={styles.empty}>
						Aucun joueur disponible. Crée d'abord des joueurs dans l'onglet Joueurs.
					</Text>
				)}
			</ScrollView>

			<Button
				label={submitLabel}
				disabled={!canSubmit}
				onPress={() => onSubmit({ name: name.trim(), playerIds: selectedIds })}
				style={styles.submit}
			/>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					flex: 1,
					gap: SPACING.md,
				},
				sectionTitle: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
				},
				scroll: {
					flex: 1,
				},
				grid: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.sm,
					paddingBottom: SPACING.md,
				},
				empty: {
					color: colors.textMuted,
				},
				submit: {
					marginTop: SPACING.sm,
				},
			}),
		[colors],
	);
}
