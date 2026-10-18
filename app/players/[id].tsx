import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text } from "react-native";
import { PlayerForm } from "@/components/players/PlayerForm";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { SPACING } from "@/constants/theme";
import { describePlayerDeletion, getPlayerUsage } from "@/lib/playerDeletion";
import { hasDuplicateName } from "@/lib/players";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

export default function EditPlayerScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const player = usePlayersStore((s) => s.players.find((p) => p.id === id));
	const updatePlayer = usePlayersStore((s) => s.updatePlayer);
	const removePlayer = usePlayersStore((s) => s.removePlayer);
	const removePlayerFromGroups = useGroupsStore((s) => s.removePlayerFromGroups);

	if (!player) {
		return (
			<ScreenContainer edges={["bottom", "left", "right"]}>
				<Text>Joueur introuvable.</Text>
			</ScreenContainer>
		);
	}

	const confirmDelete = () => {
		const usage = getPlayerUsage(
			player.id,
			useHistoryStore.getState().sessions,
			useGroupsStore.getState().groups,
			useSessionStore.getState().playerIds,
		);
		if (usage.inOngoingSession) {
			Alert.alert(
				"Joueur en pleine partie",
				`${player.name} joue la partie en cours. Termine-la ou abandonne-la avant de le supprimer.`,
			);
			return;
		}

		const archive = () => {
			updatePlayer(player.id, { isArchived: true });
			router.back();
		};
		// Ses scores restent dans l'historique (affichés « Joueur supprimé ») : seuls les groupes,
		// qui ne sont que des raccourcis de sélection, perdent sa trace.
		const remove = () => {
			removePlayerFromGroups(player.id);
			removePlayer(player.id);
			router.back();
		};
		Alert.alert("Supprimer ce joueur ?", describePlayerDeletion(player, usage), [
			{ text: "Annuler", style: "cancel" },
			...(player.isArchived ? [] : [{ text: "Archiver", onPress: archive }]),
			{ text: "Supprimer", style: "destructive", onPress: remove },
		]);
	};

	return (
		<ScreenContainer edges={["bottom", "left", "right"]}>
			<PlayerForm
				playerId={player.id}
				initialName={player.name}
				submitLabel="Enregistrer"
				onSubmit={({ name }) => {
					const isDuplicate = hasDuplicateName(usePlayersStore.getState().players, name, player.id);
					updatePlayer(player.id, { name });

					if (isDuplicate) {
						Alert.alert(
							"Un joueur du même nom existe déjà",
							"Pense à renommer l'un des deux pour les distinguer facilement dans les listes.",
							[{ text: "Compris", onPress: () => router.back() }],
						);
					} else {
						router.back();
					}
				}}
			/>
			<Button
				label="Supprimer le joueur"
				variant="danger"
				onPress={confirmDelete}
				style={styles.deleteButton}
			/>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	deleteButton: {
		marginTop: SPACING.xl,
	},
});
