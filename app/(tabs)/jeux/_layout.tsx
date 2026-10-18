import { Stack } from "expo-router";
import { useColors } from "@/hooks/useColors";

// Stack imbriqué dans l'onglet "Jeux" (au lieu d'un Stack racine) pour que la barre d'onglets
// reste visible pendant toute la création/saisie, au lieu de disparaître.
export default function JeuxLayout() {
	const colors = useColors();

	return (
		<Stack
			screenOptions={{
				headerStyle: { backgroundColor: colors.surface },
				headerTintColor: colors.text,
				headerTitleStyle: { color: colors.text },
				contentStyle: { backgroundColor: colors.background },
			}}
		>
			<Stack.Screen name="index" options={{ title: "Jeux" }} />
			<Stack.Screen name="new" options={{ title: "Nouveau jeu" }} />
			<Stack.Screen name="import" options={{ title: "Importer un jeu" }} />
			<Stack.Screen name="[id]/index" options={{ title: "Jeu" }} />
			<Stack.Screen name="[id]/edit" options={{ title: "Modifier le jeu" }} />
			<Stack.Screen name="play/[categoryId]" options={{ title: "Score" }} />
			<Stack.Screen name="play/results" options={{ title: "Résultats" }} />
		</Stack>
	);
}
