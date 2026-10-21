import type { Href } from "expo-router";
import { getRoundCount, scoreKey } from "@/lib/rounds";
import type { GameDef, Session, SessionEntry, SessionSetup, Team } from "@/types/game";
import type { Player } from "@/types/player";

/** Ce qu'une partie reprend de son jeu à son lancement : règles de classement, équipes, manches
 * ouvertes. */
export function getSessionSetup(game: GameDef, teams?: Team[] | null): SessionSetup {
	return {
		...(game.lowestWins && { lowestWins: true }),
		...(game.tieBreakerId && { tieBreakerId: game.tieBreakerId }),
		...(game.teamPlay && teams && { teams }),
		...(game.openRounds && { openRounds: game.openRounds }),
	};
}

/** Une étape de saisie : une catégorie dans une manche (numérotée à partir de 1). */
export type ScoringStep = { categoryId: string; round: number };

/**
 * Étapes d'une partie dans l'ordre : toutes les catégories de la manche 1, puis de la 2…
 * `roundCount` : manches commencées d'une partie en manches ouvertes, à défaut celles du jeu.
 */
export function getScoringSteps(game: GameDef, roundCount = getRoundCount(game)): ScoringStep[] {
	return Array.from({ length: roundCount }, (_, index) =>
		game.categories.map((c) => ({ categoryId: c.id, round: index + 1 })),
	).flat();
}

/**
 * Écran de saisie d'une étape. La manche est toujours dans l'URL, même la 1 : `dismissTo` vers une
 * étape de la manche 1 doit écraser la manche de l'écran courant, pas la conserver.
 * `focusFirstField` : étape atteinte par la touche Entrée, son premier champ prend le clavier.
 */
export function getStepHref(step: ScoringStep, { focusFirstField = false } = {}): Href {
	const href = `/jeux/play/${step.categoryId}?round=${step.round}`;
	return focusFirstField ? `${href}&focus=1` : href;
}

/** Première étape : lancement, partie rejouée ou correction depuis les résultats. */
export function getFirstStepHref(game: GameDef): Href {
	return getRoundStartHref(game, 1);
}

/** Première catégorie d'une manche. */
export function getRoundStartHref(game: GameDef, round: number): Href {
	return getStepHref({ categoryId: game.categories[0].id, round });
}

/** Récapitulatif de fin de manche d'une partie en manches ouvertes. */
export function getRoundEndHref(round: number): Href {
	return `/jeux/play/round-end?round=${round}`;
}

/**
 * Étape où reprendre une partie en cours : la dernière affichée si elle existe encore dans le jeu,
 * sinon la première (partie enregistrée avant le suivi de l'étape, ou catégorie disparue).
 */
export function getResumeStep(
	game: GameDef,
	currentCategoryId: string | null,
	currentRound: number | null,
	roundCount?: number,
): ScoringStep {
	const steps = getScoringSteps(game, roundCount);
	const round = currentRound ?? 1;
	return steps.find((s) => s.categoryId === currentCategoryId && s.round === round) ?? steps[0];
}

/** Étape où au moins un joueur n'a rien de saisi. */
export type MissingStep = ScoringStep & { playerIds: string[] };

/**
 * Étapes laissées vides, dans l'ordre de la partie, avec les joueurs concernés. Un score jamais
 * saisi n'est pas un 0 saisi : le champ affiche 0, mais personne n'a confirmé cette valeur.
 */
export function getMissingSteps(
	game: GameDef,
	playerIds: string[],
	entries: Record<string, SessionEntry>,
	roundCount?: number,
): MissingStep[] {
	return getScoringSteps(game, roundCount)
		.map((step) => {
			const key = scoreKey(step.categoryId, step.round);
			const missing = playerIds.filter(
				(id) => entries[id] && entries[id].scores[key] === undefined,
			);
			return { ...step, playerIds: missing };
		})
		.filter((step) => step.playerIds.length > 0);
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
