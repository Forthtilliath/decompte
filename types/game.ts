import type { TokenDenomination } from "@/lib/tokens";

/** Une option d'une catégorie "choice" : un libellé affiché et le score qu'il rapporte. */
export type ChoiceOption = {
	id: string;
	label: string;
	value: number;
};

/**
 * Une catégorie de score se calcule d'une de ces façons :
 * - "manual" : un nombre saisi/ajusté à la main (le cas le plus courant), avec négatif et
 *   plafond en option. Avec `unitValue` (ex. −4 par calamité), on saisit au choix le nombre
 *   d'unités (multiplié automatiquement) ou les points directement, par pas de |unitValue|.
 * - "tokens" : une liste de jetons pondérés à compter, sommés automatiquement (voir
 *   TokenCounterSheet) — pratique pour les jeux à jetons de victoire/défaite type 7 Wonders.
 * - "choice" : une valeur choisie parmi une liste d'options à score fixe (ex. palier atteint).
 * - "boolean" : une condition Oui/Non, chaque réponse rapportant son propre score.
 */
export type ScoringBrick =
	| { kind: "manual"; allowNegative: boolean; max?: number; unitValue?: number }
	| { kind: "tokens"; tokens: TokenDenomination[] }
	| { kind: "choice"; options: ChoiceOption[] }
	| { kind: "boolean"; yesValue: number; noValue: number };

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
