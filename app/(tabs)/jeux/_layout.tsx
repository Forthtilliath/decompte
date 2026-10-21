import { Stack } from "expo-router";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";

// Stack imbriqué dans l'onglet "Jeux" (au lieu d'un Stack racine) pour que la barre d'onglets
// reste visible pendant toute la création/saisie, au lieu de disparaître.
export default function JeuxLayout() {
	const screenOptions = useStackScreenOptions();

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen name="index" options={{ title: "Jeux" }} />
			<Stack.Screen name="new" options={{ title: "Nouveau jeu" }} />
			<Stack.Screen name="import" options={{ title: "Importer un jeu" }} />
			<Stack.Screen name="modeles" options={{ title: "Modèles de jeux" }} />
			<Stack.Screen name="scanner" options={{ title: "Scanner un QR code" }} />
			<Stack.Screen name="[id]/index" options={{ title: "Jeu" }} />
			<Stack.Screen name="[id]/edit" options={{ title: "Modifier le jeu" }} />
			{/* Glissé horizontal : l'étape suivante arrive du côté où l'on balaie pour l'atteindre. */}
			<Stack.Screen
				name="play/[categoryId]"
				options={{ title: "Score", animation: "slide_from_right" }}
			/>
			<Stack.Screen name="play/round-end" options={{ title: "Fin de manche" }} />
			<Stack.Screen name="play/results" options={{ title: "Résultats" }} />
		</Stack>
	);
}
