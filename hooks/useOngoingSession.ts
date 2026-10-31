import { usePersistHydrated } from "@forthtilliath/react-native-kit/hooks/usePersistHydrated";
import { confirmDestructive } from "@forthtilliath/react-native-kit/utils/helpers/confirmDestructive";
import { useRouter } from "expo-router";
import { getSessionRoundCount } from "@/lib/rounds";
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
	const roundCount = useSessionStore((s) => s.roundCount);
	const hasOngoingSession = useSessionStore((s) => s.hasOngoingSession());
	const resetSession = useSessionStore((s) => s.resetSession);
	const ongoingGame = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));
	// Jeu absent une fois les jeux relus : retiré par une restauration ou une donnée non reprise.
	// Avant la relecture, tout jeu semblerait absent.
	const gamesHydrated = usePersistHydrated(GAMES_STORE);
	const isOrphan = hasOngoingSession && gamesHydrated && !ongoingGame;

	const resume = () => {
		if (!ongoingGame) return;
		const rounds = getSessionRoundCount(ongoingGame, roundCount);
		router.push(getStepHref(getResumeStep(ongoingGame, currentCategoryId, currentRound, rounds)));
	};

	const confirmAbandon = () => {
		confirmDestructive("Abandonner la partie en cours ?", resetSession, {
			message: "Les scores déjà saisis seront perdus.",
			confirmLabel: "Abandonner",
		});
	};

	return { hasOngoingSession, ongoingGame, isOrphan, resume, confirmAbandon };
}
