import { Redirect } from "expo-router";

// Pas d'écran "racine" dédié : l'app s'ouvre directement sur l'onglet Jeux.
export default function Index() {
	return <Redirect href="/jeux" />;
}
