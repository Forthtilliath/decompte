import { clamp } from "@forthtilliath/ts-kit/number/clamp";
import { MAX_SESSION_SCORE } from "@/lib/gameLimits";
import { parseScoreKey, scoreKey } from "@/lib/rounds";
import type { CategoryDef, SessionEntry } from "@/types/game";

/**
 * Recalcule les points des catégories multiplicateur d'un joueur : nombre saisi × points de la
 * catégorie multipliée, dans la même manche (0 tant qu'elle n'est pas saisie). Les catégories sont
 * parcourues dans l'ordre du jeu : un multiplicateur peut en multiplier un autre placé avant lui.
 * Renvoie l'entrée elle-même si rien ne change.
 */
export function applyProducts(entry: SessionEntry, categories: CategoryDef[]): SessionEntry {
	const factors = entry.factors;
	if (!factors) return entry;

	let scores = entry.scores;
	for (const category of categories) {
		const { brick } = category;
		if (brick.kind !== "product") continue;
		for (const [key, factor] of Object.entries(factors)) {
			const { categoryId, round } = parseScoreKey(key);
			if (categoryId !== category.id) continue;
			const source = scores[scoreKey(brick.sourceId, round)] ?? 0;
			// Borné comme une sauvegarde : un produit énorme la ferait refuser entière.
			const points = clamp(factor * source, -MAX_SESSION_SCORE, MAX_SESSION_SCORE);
			if (scores[key] !== points) scores = { ...scores, [key]: points };
		}
	}
	return scores === entry.scores ? entry : { ...entry, scores };
}
