import type { GameDef, SessionEntry } from "@/types/game";

/**
 * Un jeu en plusieurs manches (ex. Pixies, 3 manches) rejoue toutes ses catégories à chaque
 * manche. Les scores restent dans `SessionEntry.scores`, sous une clé par catégorie et par manche :
 * l'id de la catégorie seul pour la manche 1, `<id>#<manche>` pour les suivantes. Les parties déjà
 * jouées et les jeux à une seule manche restent ainsi lisibles tels quels, sans migration. Les id
 * de catégorie (nanoid) ne contiennent jamais `#`.
 */
const ROUND_SEPARATOR = "#";

/** Nombre de manches d'un jeu : 1 pour un jeu créé avant l'ajout des manches. Un jeu en manches
 * ouvertes n'en a pas de fixé : celles d'une partie sont suivies par stores/sessionStore. */
export function getRoundCount(game: GameDef): number {
	return game.rounds ?? 1;
}

/** Manches d'une partie en cours : celles commencées en manches ouvertes (`roundCount` du store de
 * partie), sinon celles du jeu. */
export function getSessionRoundCount(game: GameDef, roundCount: number | null): number {
	return roundCount ?? getRoundCount(game);
}

/** Ce que la liste et la fiche d'un jeu disent de ses manches, `null` pour une seule manche. */
export function describeRounds(game: GameDef): string | null {
	if (game.openRounds) {
		const { scoreLimit } = game.openRounds;
		return scoreLimit === undefined ? "manches libres" : `jusqu'à ${scoreLimit} points`;
	}
	const roundCount = getRoundCount(game);
	return roundCount > 1 ? `${roundCount} manches` : null;
}

/** Dernière manche où au moins un joueur a un score saisi : 1 si aucune. */
export function getLastScoredRound(entries: SessionEntry[]): number {
	const rounds = entries.flatMap((e) => Object.keys(e.scores).map((k) => parseScoreKey(k).round));
	return Math.max(1, ...rounds);
}

/** Joueurs ou équipes dont le total atteint le seuil de fin de partie (aucun sans seuil). */
export function getScoreLimitReachers<T extends { total: number }>(
	contenders: T[],
	scoreLimit: number | undefined,
): T[] {
	if (scoreLimit === undefined) return [];
	return contenders.filter((c) => c.total >= scoreLimit);
}

/** Clé du score d'une catégorie pour une manche (numérotée à partir de 1). */
export function scoreKey(categoryId: string, round: number): string {
	return round <= 1 ? categoryId : `${categoryId}${ROUND_SEPARATOR}${round}`;
}

/** Catégorie et manche d'une clé de score. */
export function parseScoreKey(key: string): { categoryId: string; round: number } {
	const [categoryId, round] = key.split(ROUND_SEPARATOR);
	return { categoryId, round: Number(round) || 1 };
}

/** Points par catégorie, toutes manches confondues. */
export function sumByCategory(scores: Record<string, number>): Record<string, number> {
	const totals: Record<string, number> = {};
	for (const [key, points] of Object.entries(scores)) {
		const { categoryId } = parseScoreKey(key);
		totals[categoryId] = (totals[categoryId] ?? 0) + points;
	}
	return totals;
}

/**
 * Points de chaque manche (index 0 = manche 1). Au moins `roundCount` manches, plus si la partie
 * en a joué davantage avant une modification du jeu : le détail reste égal au total.
 */
export function sumByRound(scores: Record<string, number>, roundCount: number): number[] {
	const rounds = Object.keys(scores).map((key) => parseScoreKey(key).round);
	const totals = Array.from({ length: Math.max(roundCount, ...rounds) }, () => 0);
	for (const [key, points] of Object.entries(scores)) {
		totals[parseScoreKey(key).round - 1] += points;
	}
	return totals;
}
