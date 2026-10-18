import { confirmDestructive } from "@forthtilliath/react-native-kit/utils/helpers/confirmDestructive";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text } from "react-native";
import { PlayerForm } from "@/components/players/PlayerForm";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { SPACING } from "@/constants/theme";
import { hasDuplicateName } from "@/lib/players";
import { usePlayersStore } from "@/stores/playersStore";

export default function EditPlayerScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const player = usePlayersStore((s) => s.players.find((p) => p.id === id));
	const updatePlayer = usePlayersStore((s) => s.updatePlayer);
	const removePlayer = usePlayersStore((s) => s.removePlayer);

	if (!player) {
		return (
			<ScreenContainer edges={["bottom", "left", "right"]}>
				<Text>Joueur introuvable.</Text>
			</ScreenContainer>
		);
	}

	const confirmDelete = () => {
		confirmDestructive(
			"Supprimer ce joueur ?",
			() => {
				removePlayer(player.id);
				router.back();
			},
			{
				message: `${player.name} sera définitivement supprimé. Son historique de parties passées est conservé.`,
			},
		);
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
