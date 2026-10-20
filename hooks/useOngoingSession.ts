import { confirmDestructive } from "@forthtilliath/react-native-kit/utils/helpers/confirmDestructive";
import { useRouter } from "expo-router";
import { useStoresHydrated } from "@/hooks/useStoresHydrated";
import { getResumeStep, getStepHref } from "@/lib/sessionFlow";
import { useGamesStore } from "@/stores/gamesStore";
import { useSessionStore } from "@/stores/sessionStore";

const GAMES_STORE = [useGamesStore];

/** Reprise et abandon de la partie en cours, partagés par la liste des jeux et la fiche d'un jeu. */
export function useOngoingSession() {
	const router = useRouter();
	const gameDefId = useSessionStore((s) => s.gameDefId);
	const currentCategoryId = useSessionStore((s) => s.currentCategoryId);
	const currentRound = useSessionStore((s) => s.currentRound);
	const hasOngoingSession = useSessionStore((s) => s.hasOngoingSession());
	const resetSession = useSessionStore((s) => s.resetSession);
	const ongoingGame = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));
	// Jeu absent une fois les jeux relus : retiré par une restauration ou une donnée non reprise.
	// Avant la relecture, tout jeu semblerait absent.
	const gamesHydrated = useStoresHydrated(GAMES_STORE);
	const isOrphan = hasOngoingSession && gamesHydrated && !ongoingGame;

	const resume = () => {
		if (!ongoingGame) return;
		router.push(getStepHref(getResumeStep(ongoingGame, currentCategoryId, currentRound)));
	};

	const confirmAbandon = () => {
		confirmDestructive("Abandonner la partie en cours ?", resetSession, {
			message: "Les scores déjà saisis seront perdus.",
			confirmLabel: "Abandonner",
		});
	};

	return { hasOngoingSession, ongoingGame, isOrphan, resume, confirmAbandon };
}
