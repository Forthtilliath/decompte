import type { Href } from "expo-router";
import { getRoundCount } from "@/lib/rounds";
import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

/** Une étape de saisie : une catégorie dans une manche (numérotée à partir de 1). */
export type ScoringStep = { categoryId: string; round: number };

/** Étapes d'une partie dans l'ordre : toutes les catégories de la manche 1, puis de la 2… */
export function getScoringSteps(game: GameDef): ScoringStep[] {
	return Array.from({ length: getRoundCount(game) }, (_, index) =>
		game.categories.map((c) => ({ categoryId: c.id, round: index + 1 })),
	).flat();
}

/**
 * Écran de saisie d'une étape. La manche est toujours dans l'URL, même la 1 : `dismissTo` vers une
 * étape de la manche 1 doit écraser la manche de l'écran courant, pas la conserver.
 */
export function getStepHref(step: ScoringStep): Href {
	return `/jeux/play/${step.categoryId}?round=${step.round}`;
}

/** Première étape : lancement, partie rejouée ou correction depuis les résultats. */
export function getFirstStepHref(game: GameDef): Href {
	return getStepHref({ categoryId: game.categories[0].id, round: 1 });
}

/**
 * Étape où reprendre une partie en cours : la dernière affichée si elle existe encore dans le jeu,
 * sinon la première (partie enregistrée avant le suivi de l'étape, ou catégorie disparue).
 */
export function getResumeStep(
	game: GameDef,
	currentCategoryId: string | null,
	currentRound: number | null,
): ScoringStep {
	const steps = getScoringSteps(game);
	const round = currentRound ?? 1;
	return steps.find((s) => s.categoryId === currentCategoryId && s.round === round) ?? steps[0];
}

export type ReplayPlan =
	| { ok: true; playerIds: string[]; isPartial: boolean }
	| { ok: false; reason: string };

/**
 * Joueurs avec qui rejouer une partie de l'historique : ceux qui ne sont pas archivés depuis,
 * dans la limite du maximum actuel du jeu (ses bornes ont pu changer après la partie).
 */
export function getReplayPlan(session: Session, game: GameDef, players: Player[]): ReplayPlan {
	const available = session.playerIds
		.filter((id) => players.some((p) => p.id === id && !p.isArchived))
		.slice(0, game.maxPlayers);

	if (available.length < game.minPlayers) {
		return {
			ok: false,
			reason: `Il faut au moins ${game.minPlayers} joueur(s) disponible(s) parmi ceux de cette partie.`,
		};
	}
	return {
		ok: true,
		playerIds: available,
		isPartial: available.length < session.playerIds.length,
	};
}
