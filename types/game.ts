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
 * - "product" : un multiplicateur, un nombre saisi multiplié par les points du joueur dans une
 *   catégorie placée avant elle (même manche), ex. nombre de sets × valeur des sets (lib/products).
 */
export type ScoringBrick =
	| { kind: "manual"; allowNegative: boolean; max?: number; unitValue?: number }
	| { kind: "tokens"; tokens: TokenDenomination[] }
	| { kind: "choice"; options: ChoiceOption[] }
	| { kind: "boolean"; yesValue: number; noValue: number }
	| { kind: "product"; sourceId: string };

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
	/** Critère à remplir pour que la catégorie compte (ex. un objectif minimum) : pendant la
	 * partie, chaque joueur a une case à cocher, et ses points ne se saisissent qu'une fois cochée.
	 * Absent d'une catégorie créée avant son ajout : pas de critère. */
	requiresValidation?: boolean;
};

export type GameDef = {
	id: string;
	name: string;
	categories: CategoryDef[];
	minPlayers: number;
	maxPlayers: number;
	/** Nombre de manches : toutes les catégories se saisissent une fois par manche (voir
	 * lib/rounds). Absent d'un jeu créé avant l'ajout des manches : 1. */
	rounds?: number;
	createdAt: number;
	/** Jamais de suppression définitive (même logique que Player/PlayerGroup) : un jeu archivé
	 * disparaît de la liste active mais reste résolvable pour l'historique des parties déjà jouées. */
	isArchived: boolean;
	/** Jeu en équipes : au lancement, chaque joueur rejoint une équipe, et le classement se fait sur
	 * le total de chaque équipe (somme de ses joueurs). */
	teamPlay?: boolean;
} & RankingRules;

/**
 * Règles de classement d'un jeu (absentes : le plus haut total gagne, égalités partagées). Elles
 * sont recopiées dans chaque partie à son lancement : modifier le jeu ne reclasse pas l'historique.
 */
export type RankingRules = {
	/** Le total le plus bas gagne (golf, Skyjo…). */
	lowestWins?: boolean;
	/** Catégorie qui départage deux totaux égaux : le plus de points dans cette catégorie
	 * (toutes manches confondues) passe devant. */
	tieBreakerId?: string;
};

/** Ce que le lancement d'une partie reprend du jeu, en plus des joueurs. */
export type SessionSetup = RankingRules & { teams?: Team[] };

/** Une équipe d'une partie en équipes : son total est la somme de ceux de ses joueurs. */
export type Team = {
	id: string;
	name: string;
	playerIds: string[];
};

/** Scores d'un joueur pour une partie, indexés par id de catégorie (et par manche, voir
 * lib/rounds : `scoreKey`). */
export type SessionEntry = {
	playerId: string;
	scores: Record<string, number>;
	/** Clés de score (même format que `scores`) dont le critère est validé par ce joueur, pour les
	 * catégories à critère. Un critère non validé n'a pas de score : les totaux n'en dépendent pas,
	 * et l'historique reste juste même si le jeu est modifié ensuite. */
	validated?: string[];
	/** Nombre saisi pour chaque catégorie multiplicateur, par clé de score. Ses points restent
	 * dans `scores` (recalculés quand la catégorie multipliée change, voir lib/products). */
	factors?: Record<string, number>;
};

export type Session = {
	id: string;
	gameDefId: string;
	createdAt: number;
	finishedAt?: number;
	playerIds: string[];
	entries: Record<string, SessionEntry>;
	/** Équipes d'une partie en équipes (absentes : chacun pour soi). */
	teams?: Team[];
} & RankingRules;

export function createEmptySessionEntry(playerId: string): SessionEntry {
	return { playerId, scores: {} };
}
