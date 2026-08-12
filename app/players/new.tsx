import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { PlayerForm } from "@/components/players/PlayerForm";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { hasDuplicateName } from "@/lib/players";
import { createId } from "@/lib/uuid";
import { usePlayersStore } from "@/stores/playersStore";

export default function NewPlayerScreen() {
	const router = useRouter();
	const addPlayer = usePlayersStore((s) => s.addPlayer);
	// Généré ici (avant même la saisie) plutôt que par addPlayer, pour que la couleur d'avatar
	// affichée pendant la création (dérivée de cet id) soit déjà la couleur finale du joueur.
	const [playerId] = useState(() => createId());

	return (
		<ScreenContainer edges={["bottom", "left", "right"]}>
			<PlayerForm
				playerId={playerId}
				submitLabel="Créer le joueur"
				onSubmit={({ name }) => {
					const isDuplicate = hasDuplicateName(usePlayersStore.getState().players, name);
					addPlayer({ id: playerId, name });

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
		</ScreenContainer>
	);
}
