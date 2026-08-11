import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { selectSortedPlayers, usePlayersStore } from "@/stores/playersStore";

export default function PlayersScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const players = usePlayersStore((s) => s.players);
	const addPlayer = usePlayersStore((s) => s.addPlayer);
	const removePlayer = usePlayersStore((s) => s.removePlayer);
	const [name, setName] = useState("");

	const activePlayers = selectSortedPlayers(players.filter((p) => !p.isArchived));

	const handleAdd = () => {
		if (!name.trim()) return;
		addPlayer({ name });
		setName("");
	};

	const confirmRemove = (id: string, playerName: string) => {
		Alert.alert(`Supprimer ${playerName} ?`, undefined, [
			{ text: "Annuler", style: "cancel" },
			{ text: "Supprimer", style: "destructive", onPress: () => removePlayer(id) },
		]);
	};

	return (
		<ScreenContainer style={styles.container}>
			<View style={styles.addRow}>
				<View style={styles.addField}>
					<TextField
						placeholder="Nom du joueur"
						value={name}
						onChangeText={setName}
						onSubmitEditing={handleAdd}
					/>
				</View>
				<Button label="Ajouter" onPress={handleAdd} />
			</View>

			<ScrollView contentContainerStyle={styles.list}>
				{activePlayers.map((player) => (
					<View key={player.id} style={styles.row}>
						<PlayerAvatar
							name={player.name}
							avatarUri={player.avatarUri}
							seed={player.id}
							size={40}
						/>
						<Text style={styles.name} numberOfLines={1}>
							{player.name}
						</Text>
						<Text style={styles.remove} onPress={() => confirmRemove(player.id, player.name)}>
							Supprimer
						</Text>
					</View>
				))}
				{activePlayers.length === 0 && (
					<Text style={styles.empty}>Aucun joueur pour l'instant. Ajoute-en un ci-dessus.</Text>
				)}
			</ScrollView>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.sm,
				},
				addRow: {
					flexDirection: "row",
					gap: SPACING.sm,
					alignItems: "flex-end",
				},
				addField: {
					flex: 1,
				},
				list: {
					gap: SPACING.sm,
					paddingTop: SPACING.sm,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 16,
					fontWeight: "600",
				},
				remove: {
					color: colors.danger,
					fontSize: 13,
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
