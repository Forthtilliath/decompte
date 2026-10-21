import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { plural } from "@/lib/plural";
import { useGamesStore } from "@/stores/gamesStore";
import type { GameDef } from "@/types/game";

/**
 * Suppression définitive d'un jeu, seulement s'il n'a aucune partie dans l'historique : ces parties
 * ont besoin de sa définition (catégories, manches) pour s'afficher. Sinon, l'archivage est proposé.
 */
export function useDeleteGame() {
	const router = useRouter();
	const removeGame = useGamesStore((s) => s.removeGame);

	return (game: GameDef, sessionCount: number, archive: () => void) => {
		if (sessionCount > 0) {
			const parties = `${sessionCount} ${plural(sessionCount, "partie")}`;
			Alert.alert(
				"Suppression impossible",
				`« ${game.name} » a ${parties} dans l'historique, qui en ont besoin pour s'afficher.` +
					(game.isArchived ? "" : " Archive-le pour le retirer de la liste."),
				game.isArchived
					? [{ text: "Compris" }]
					: [
							{ text: "Annuler", style: "cancel" },
							{ text: "Archiver", onPress: archive },
						],
			);
			return;
		}

		Alert.alert("Supprimer ce jeu ?", `« ${game.name} » sera définitivement supprimé.`, [
			{ text: "Annuler", style: "cancel" },
			{
				text: "Supprimer",
				style: "destructive",
				onPress: () => {
					removeGame(game.id);
					router.dismissTo("/jeux");
				},
			},
		]);
	};
}
