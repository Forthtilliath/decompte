import { sum } from "@forthtilliath/ts-kit/number/sum";
import { sumByCategory } from "@/lib/rounds";
import type { RankingRules, SessionEntry, Team } from "@/types/game";

/** Somme de toutes les catégories saisies pour un joueur. */
export function computeEntryTotal(entry: SessionEntry): number {
	return sum(Object.values(entry.scores));
}

export type RankedEntry = {
	playerId: string;
	total: number;
	rank: number;
};

export type RankedTeam = {
	teamId: string;
	name: string;
	playerIds: string[];
	total: number;
	rank: number;
};

type Contender = { total: number; tieBreak: number };

/** Points d'un joueur dans la catégorie de départage (0 sans départage). */
function tieBreakOf(entry: SessionEntry | undefined, rules: RankingRules): number {
	if (!entry || !rules.tieBreakerId) return 0;
	return sumByCategory(entry.scores)[rules.tieBreakerId] ?? 0;
}

/** Ordre du classement : le meilleur total d'abord, puis le plus de points au départage. */
function compareContenders(a: Contender, b: Contender, rules: RankingRules): number {
	const byTotal = rules.lowestWins ? a.total - b.total : b.total - a.total;
	return byTotal || b.tieBreak - a.tieBreak;
}

/**
 * Trie et numérote en "competition ranking" (1, 2, 2, 4) : deux concurrents à égalité (total et
 * départage) partagent le même rang. Tri stable : les ex aequo gardent l'ordre reçu.
 */
function rankContenders<T extends Contender>(
	contenders: T[],
	rules: RankingRules,
): (T & { rank: number })[] {
	const sorted = [...contenders].sort((a, b) => compareContenders(a, b, rules));
	const ranked: (T & { rank: number })[] = [];
	sorted.forEach((contender, index) => {
		const tied = index > 0 && compareContenders(contender, sorted[index - 1], rules) === 0;
		ranked.push({ ...contender, rank: tied ? ranked[index - 1].rank : index + 1 });
	});
	return ranked;
}

/** Classement des joueurs, chacun pour soi, selon les règles du jeu (voir RankingRules). */
export function rankEntries(entries: SessionEntry[], rules: RankingRules = {}): RankedEntry[] {
	return rankContenders(
		entries.map((entry) => ({
			playerId: entry.playerId,
			total: computeEntryTotal(entry),
			tieBreak: tieBreakOf(entry, rules),
		})),
		rules,
	).map(({ playerId, total, rank }) => ({ playerId, total, rank }));
}

/** Classement des équipes : total et départage additionnés sur leurs joueurs. */
export function rankTeams(
	teams: Team[],
	entries: Record<string, SessionEntry>,
	rules: RankingRules = {},
): RankedTeam[] {
	return rankContenders(
		teams.map((team) => {
			const members = team.playerIds.map((id) => entries[id]).filter(Boolean);
			return {
				teamId: team.id,
				name: team.name,
				playerIds: team.playerIds,
				total: sum(members.map(computeEntryTotal)),
				tieBreak: sum(members.map((entry) => tieBreakOf(entry, rules))),
			};
		}),
		rules,
	).map(({ tieBreak: _tieBreak, ...team }) => team);
}

/** Ce qu'il faut d'une partie (terminée ou en cours) pour la classer. */
export type RankableSession = RankingRules & {
	entries: Record<string, SessionEntry>;
	playerIds: string[];
	teams?: Team[];
};

export type SessionRanking = {
	/** Joueurs du classement. En équipes, chacun prend le rang de son équipe, et les joueurs sont
	 * groupés par équipe dans l'ordre du classement des équipes. */
	players: RankedEntry[];
	/** Classement des équipes, `null` pour une partie sans équipes. */
	teams: RankedTeam[] | null;
};

export function rankSession(session: RankableSession): SessionRanking {
	const entries = session.playerIds.map((id) => session.entries[id]).filter(Boolean);
	if (!session.teams || session.teams.length === 0) {
		return { players: rankEntries(entries, session), teams: null };
	}

	// Un joueur sans équipe (ne devrait pas arriver) n'est pas perdu : il est classé comme une
	// équipe à lui seul, sans apparaître dans le classement des équipes.
	const inTeam = new Set(session.teams.flatMap((team) => team.playerIds));
	const loners = entries
		.filter((entry) => !inTeam.has(entry.playerId))
		.map((entry) => ({ id: `solo-${entry.playerId}`, name: "", playerIds: [entry.playerId] }));
	const lonerIds = new Set(loners.map((loner) => loner.id));
	const teams = rankTeams([...session.teams, ...loners], session.entries, session);
	const players = teams.flatMap((team) =>
		rankEntries(team.playerIds.map((id) => session.entries[id]).filter(Boolean), session).map(
			(entry) => ({ ...entry, rank: team.rank }),
		),
	);
	return { players, teams: teams.filter((team) => !lonerIds.has(team.teamId)) };
}
