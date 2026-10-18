import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

/**
 * Étape où reprendre une partie en cours : la dernière affichée si elle existe encore dans le jeu,
 * sinon la première (partie enregistrée avant le suivi de l'étape, ou catégorie disparue).
 */
export function getResumeCategoryId(game: GameDef, currentCategoryId: string | null): string {
	const current = game.categories.find((c) => c.id === currentCategoryId);
	return (current ?? game.categories[0]).id;
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
