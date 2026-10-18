import { useRouter } from "expo-router";
import { Alert } from "react-native";
import { getResumeCategoryId } from "@/lib/sessionFlow";
import { useGamesStore } from "@/stores/gamesStore";
import { useSessionStore } from "@/stores/sessionStore";

/** Reprise et abandon de la partie en cours, partagés par la liste des jeux et la fiche d'un jeu. */
export function useOngoingSession() {
	const router = useRouter();
	const gameDefId = useSessionStore((s) => s.gameDefId);
	const currentCategoryId = useSessionStore((s) => s.currentCategoryId);
	const hasOngoingSession = useSessionStore((s) => s.hasOngoingSession());
	const resetSession = useSessionStore((s) => s.resetSession);
	const ongoingGame = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));

	const resume = () => {
		if (!ongoingGame) return;
		router.push(`/jeux/play/${getResumeCategoryId(ongoingGame, currentCategoryId)}`);
	};

	const confirmAbandon = () => {
		Alert.alert("Abandonner la partie en cours ?", "Les scores déjà saisis seront perdus.", [
			{ text: "Annuler", style: "cancel" },
			{ text: "Abandonner", style: "destructive", onPress: resetSession },
		]);
	};

	return { hasOngoingSession, ongoingGame, resume, confirmAbandon };
}
