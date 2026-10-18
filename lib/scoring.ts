import { sum } from "@forthtilliath/ts-kit/number/sum";
import type { SessionEntry } from "@/types/game";

/** Somme de toutes les catégories saisies pour un joueur. */
export function computeEntryTotal(entry: SessionEntry): number {
	return sum(Object.values(entry.scores));
}

export type RankedEntry = {
	playerId: string;
	total: number;
	rank: number;
};

/**
 * Classement par "competition ranking" (1, 2, 2, 4) : deux totaux égaux partagent le même rang,
 * sans critère de départage secondaire (contrairement à un jeu précis qui pourrait avoir sa propre
 * règle d'égalité — hors scope du moteur générique).
 */
export function rankEntries(entries: SessionEntry[]): RankedEntry[] {
	const totals = entries
		.map((entry) => ({ playerId: entry.playerId, total: computeEntryTotal(entry) }))
		.sort((a, b) => b.total - a.total);

	const ranked: RankedEntry[] = [];
	totals.forEach((entry, index) => {
		const rank =
			index === 0 || entry.total !== totals[index - 1].total ? index + 1 : ranked[index - 1].rank;
		ranked.push({ ...entry, rank });
	});
	return ranked;
}
