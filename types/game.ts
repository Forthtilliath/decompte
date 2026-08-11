import type { TokenDenomination } from "@/lib/tokens";

/**
 * Une catégorie de score se calcule d'une de ces deux façons :
 * - "manual" : un simple nombre saisi/ajusté à la main (le cas le plus courant).
 * - "tokens" : une liste de jetons pondérés à compter, sommés automatiquement (voir
 *   TokenCounterSheet) — pratique pour les jeux à jetons de victoire/défaite type 7 Wonders.
 */
export type ScoringBrick =
	| { kind: "manual"; min?: number; max?: number }
	| { kind: "tokens"; tokens: TokenDenomination[] };

/**
 * `id` généré une fois à la création et jamais réutilisé même si la catégorie est renommée ou
 * réordonnée : c'est la seule chose qui garde les parties déjà jouées valides après modification
 * du jeu (les scores enregistrés sont indexés par cet id, pas par le libellé).
 */
export type CategoryDef = {
	id: string;
	label: string;
	color: string;
	brick: ScoringBrick;
};

export type GameDef = {
	id: string;
	name: string;
	categories: CategoryDef[];
	minPlayers: number;
	maxPlayers: number;
	createdAt: number;
	/** Jamais de suppression définitive (même logique que Player/PlayerGroup) : un jeu archivé
	 * disparaît de la liste active mais reste résolvable pour l'historique des parties déjà jouées. */
	isArchived: boolean;
};

/** Scores d'un joueur pour une partie, indexés par id de catégorie. */
export type SessionEntry = {
	playerId: string;
	scores: Record<string, number>;
};

export type Session = {
	id: string;
	gameDefId: string;
	createdAt: number;
	finishedAt?: number;
	playerIds: string[];
	entries: Record<string, SessionEntry>;
};

export function createEmptySessionEntry(playerId: string): SessionEntry {
	return { playerId, scores: {} };
}
