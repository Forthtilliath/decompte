import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { parseGameExport } from "@/lib/gameExport";
import { useGamesStore } from "@/stores/gamesStore";

/**
 * Import d'un jeu partagé (texte collé ou QR code scanné) : vérifié entièrement, puis ajouté
 * après confirmation et ouvert. `onDismiss` est appelé si rien n'est importé (texte refusé ou
 * import annulé), pour pouvoir réessayer.
 */
export function useGameImport(onDismiss?: () => void) {
	const router = useRouter();
	const addGame = useGamesStore((s) => s.addGame);

	return (text: string) => {
		const result = parseGameExport(text);
		if (!result.ok) {
			if (onDismiss) {
				Alert.alert("Import impossible", result.error, [{ text: "OK", onPress: onDismiss }]);
			} else {
				Alert.alert("Import impossible", result.error);
			}
			return;
		}
		const { game } = result;
		const count = game.categories.length;
		Alert.alert(
			`Importer « ${game.name} » ?`,
			`${count} catégorie${count > 1 ? "s" : ""}. Le jeu sera ajouté à ta liste, tu pourras le modifier ensuite.`,
			[
				{ text: "Annuler", style: "cancel", onPress: onDismiss },
				{
					text: "Importer",
					onPress: () => {
						const created = addGame(game);
						router.replace(`/jeux/${created.id}`);
					},
				},
			],
		);
	};
}
