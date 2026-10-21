/** Médailles affichées pour les trois premières places (classement, historique). */
export const RANK_MEDALS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

/** Rang en toutes lettres pour le lecteur d'écran et les places sans médaille : « 1er », « 2e ». */
export function formatRank(rank: number): string {
	return rank === 1 ? "1er" : `${rank}e`;
}
