import { Stack } from "expo-router";
import { useStackScreenOptions } from "@/hooks/useStackScreenOptions";

// Stack imbriqué dans l'onglet "Réglages" pour que la barre d'onglets reste visible sur les
// sous-pages, au lieu de disparaître.
export default function ReglagesLayout() {
	const screenOptions = useStackScreenOptions();

	return (
		<Stack screenOptions={screenOptions}>
			<Stack.Screen name="index" options={{ title: "Réglages" }} />
			<Stack.Screen name="apparence" options={{ title: "Apparence" }} />
			<Stack.Screen name="sauvegarde" options={{ title: "Sauvegarde et restauration" }} />
			<Stack.Screen name="mises-a-jour" options={{ title: "Mises à jour" }} />
			<Stack.Screen name="soutenir" options={{ title: "Soutenir le projet" }} />
			<Stack.Screen name="a-propos" options={{ title: "À propos" }} />
			<Stack.Screen name="zone-dangereuse" options={{ title: "Zone dangereuse" }} />
		</Stack>
	);
}
