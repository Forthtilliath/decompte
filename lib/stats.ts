import { round } from "@forthtilliath/ts-kit/number/round";
import { sumByCategory } from "@/lib/rounds";
import type { CategoryDef, Session } from "@/types/game";
import type { Player } from "@/types/player";
import { type RankedEntry, rankEntries } from "./scoring";

/** Classement d'une partie de l'historique (même calcul que l'écran de détail). */
export function getSessionRanking(session: Session): RankedEntry[] {
	return rankEntries(Object.values(session.entries));
}

/** Date de fin d'une partie : `finishedAt` n'existe pas sur les très anciennes parties. */
function playedAt(session: Session): number {
	return session.finishedAt ?? session.createdAt;
}

export type PlayerStats = {
	gamesPlayed: number;
	wins: number;
	winRate: number;
	averageTotal: number;
	bestTotal: number;
	/** Points moyens par id de catégorie, pour les seules catégories demandées. */
	averageByCategory: Record<string, number>;
};

const EMPTY_STATS: PlayerStats = {
	gamesPlayed: 0,
	wins: 0,
	winRate: 0,
	averageTotal: 0,
	bestTotal: 0,
	averageByCategory: {},
};

/**
 * Statistiques d'un joueur sur les parties données. Une égalité à la première place compte comme
 * une victoire pour chacun des ex æquo. Les moyennes par catégorie n'ont de sens que pour un seul
 * jeu : `categories` vide (tous jeux confondus) les laisse vides.
 */
export function computePlayerStats(
	playerId: string,
	sessions: Session[],
	categories: CategoryDef[] = [],
): PlayerStats {
	const played = sessions.filter((s) => s.playerIds.includes(playerId) && s.entries[playerId]);
	if (played.length === 0) return EMPTY_STATS;

	let wins = 0;
	let totalSum = 0;
	let bestTotal = Number.NEGATIVE_INFINITY;
	const categorySums: Record<string, number> = {};

	for (const session of played) {
		const score = getSessionRanking(session).find((r) => r.playerId === playerId);
		if (!score) continue;
		totalSum += score.total;
		bestTotal = Math.max(bestTotal, score.total);
		if (score.rank === 1) wins++;

		const scores = sumByCategory(session.entries[playerId].scores);
		for (const category of categories) {
			categorySums[category.id] = (categorySums[category.id] ?? 0) + (scores[category.id] ?? 0);
		}
	}

	const averageByCategory: Record<string, number> = {};
	for (const [categoryId, total] of Object.entries(categorySums)) {
		averageByCategory[categoryId] = total / played.length;
	}

	return {
		gamesPlayed: played.length,
		wins,
		winRate: wins / played.length,
		averageTotal: totalSum / played.length,
		bestTotal,
		averageByCategory,
	};
}

export type GlobalRecords = {
	bestScore: { playerId: string; total: number; sessionId: string; gameDefId: string } | null;
	longestWinStreak: { playerId: string; streak: number } | null;
	closestGame: { gap: number; sessionId: string; gameDefId: string; playedAt: number } | null;
};

/**
 * Records de l'historique donné : meilleur score, plus longue série de victoires d'un même joueur
 * (une partie à laquelle il n'a pas participé ne la coupe pas), et plus petit écart entre les deux
 * premiers d'une partie. Chaque record vaut `null` si aucune partie ne permet de l'établir.
 */
export function computeGlobalRecords(sessions: Session[]): GlobalRecords {
	let bestScore: GlobalRecords["bestScore"] = null;
	let longestWinStreak: GlobalRecords["longestWinStreak"] = null;
	let closestGame: GlobalRecords["closestGame"] = null;
	const currentStreak = new Map<string, number>();

	// L'historique est stocké du plus récent au plus ancien : les séries se déroulent dans l'ordre
	// chronologique.
	const chronological = [...sessions].sort((a, b) => playedAt(a) - playedAt(b));

	for (const session of chronological) {
		const ranking = getSessionRanking(session);
		const where = { sessionId: session.id, gameDefId: session.gameDefId };

		for (const score of ranking) {
			if (!bestScore || score.total > bestScore.total) {
				bestScore = { playerId: score.playerId, total: score.total, ...where };
			}
			const streak = score.rank === 1 ? (currentStreak.get(score.playerId) ?? 0) + 1 : 0;
			currentStreak.set(score.playerId, streak);
			if (streak > 0 && (!longestWinStreak || streak > longestWinStreak.streak)) {
				longestWinStreak = { playerId: score.playerId, streak };
			}
		}

		if (ranking.length >= 2) {
			const gap = ranking[0].total - ranking[1].total;
			if (!closestGame || gap < closestGame.gap) {
				closestGame = { gap, playedAt: playedAt(session), ...where };
			}
		}
	}

	return { bestScore, longestWinStreak, closestGame };
}

export type PlayerLeaderboardEntry = {
	playerId: string;
	gamesPlayed: number;
	wins: number;
	winRate: number;
};

/**
 * Joueurs ayant au moins une partie, par taux de victoire décroissant. Le nombre de parties
 * départage les égalités : un taux construit sur beaucoup de parties est plus représentatif qu'un
 * 100 % obtenu sur une seule.
 */
export function computePlayerLeaderboard(
	sessions: Session[],
	players: Player[],
): PlayerLeaderboardEntry[] {
	return players
		.map((player) => {
			const { gamesPlayed, wins, winRate } = computePlayerStats(player.id, sessions);
			return { playerId: player.id, gamesPlayed, wins, winRate };
		})
		.filter((entry) => entry.gamesPlayed > 0)
		.sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);
}

export type GamePlayStats = {
	gameDefId: string;
	sessionsPlayed: number;
	lastPlayedAt: number;
};

/** Jeux de l'historique, du plus joué au moins joué (le plus récent d'abord à égalité). */
export function computeGamePlayStats(sessions: Session[]): GamePlayStats[] {
	const byGame = new Map<string, GamePlayStats>();
	for (const session of sessions) {
		const current = byGame.get(session.gameDefId) ?? {
			gameDefId: session.gameDefId,
			sessionsPlayed: 0,
			lastPlayedAt: 0,
		};
		current.sessionsPlayed += 1;
		current.lastPlayedAt = Math.max(current.lastPlayedAt, playedAt(session));
		byGame.set(session.gameDefId, current);
	}
	return [...byGame.values()].sort(
		(a, b) => b.sessionsPlayed - a.sessionsPlayed || b.lastPlayedAt - a.lastPlayedAt,
	);
}

export type PlayerGameStats = {
	gameDefId: string;
	gamesPlayed: number;
	wins: number;
	winRate: number;
};

/** Résultats d'un joueur jeu par jeu, du meilleur taux de victoire au moins bon. */
export function computePlayerGameStats(playerId: string, sessions: Session[]): PlayerGameStats[] {
	const gameIds = [...new Set(sessions.map((s) => s.gameDefId))];
	return gameIds
		.map((gameDefId) => {
			const stats = computePlayerStats(
				playerId,
				sessions.filter((s) => s.gameDefId === gameDefId),
			);
			return {
				gameDefId,
				gamesPlayed: stats.gamesPlayed,
				wins: stats.wins,
				winRate: stats.winRate,
			};
		})
		.filter((entry) => entry.gamesPlayed > 0)
		.sort((a, b) => b.winRate - a.winRate || b.gamesPlayed - a.gamesPlayed);
}

const decimalFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 });

/** Moyenne lisible à une décimale au plus, à la française (« 12,5 »). */
export function formatAverage(value: number): string {
	// `|| 0` : une petite moyenne négative arrondie à -0 s'afficherait « -0 ».
	return decimalFormatter.format(round(value, 1) || 0);
}

/** Taux (0 à 1) en pourcentage entier, ex. « 67% ». */
export function formatRate(rate: number): string {
	return `${Math.round(rate * 100)}%`;
}
