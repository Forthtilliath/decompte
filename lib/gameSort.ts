import type { GamePlayStats } from "@/lib/stats";
import type { GameDef } from "@/types/game";

export const GAME_SORT_ORDERS = ["recent", "mostPlayed", "alpha", "newest"] as const;
export type GameSortOrder = (typeof GAME_SORT_ORDERS)[number];

export const GAME_SORT_LABELS: Record<GameSortOrder, string> = {
	recent: "Joués récemment",
	mostPlayed: "Les plus joués",
	alpha: "Ordre alphabétique",
	newest: "Ajoutés récemment",
};

const byName = (a: GameDef, b: GameDef) =>
	a.name.localeCompare(b.name, "fr", { sensitivity: "base" });

/**
 * Jeux dans l'ordre choisi pour la liste. Les jeux jamais joués passent après les autres dans les
 * ordres tirés de l'historique, par ordre alphabétique ; le nom départage toute autre égalité.
 */
export function sortGames(
	games: GameDef[],
	order: GameSortOrder,
	playStats: GamePlayStats[],
): GameDef[] {
	const stats = new Map(playStats.map((s) => [s.gameDefId, s]));
	const lastPlayed = (g: GameDef) => stats.get(g.id)?.lastPlayedAt ?? 0;
	const plays = (g: GameDef) => stats.get(g.id)?.sessionsPlayed ?? 0;

	const compare: Record<GameSortOrder, (a: GameDef, b: GameDef) => number> = {
		recent: (a, b) => lastPlayed(b) - lastPlayed(a) || byName(a, b),
		mostPlayed: (a, b) => plays(b) - plays(a) || lastPlayed(b) - lastPlayed(a) || byName(a, b),
		alpha: byName,
		newest: (a, b) => b.createdAt - a.createdAt || byName(a, b),
	};
	return [...games].sort(compare[order]);
}
