import { sum } from "@forthtilliath/ts-kit/number/sum";
import { parseScoreKey, sumByRound } from "@/lib/rounds";
import {
	type RankableSession,
	type RankedEntry,
	type RankedTeam,
	rankSession,
} from "@/lib/scoring";
import type { SessionEntry } from "@/types/game";

/** Ligne du récapitulatif de fin de manche : un joueur, ou une équipe en jeu en équipes. */
export type RoundRecapLine = {
	id: string;
	name: string;
	rank: number;
	/** Total cumulé depuis le début de la partie. */
	total: number;
	/** Points marqués pendant la manche. */
	roundPoints: number;
};

/** Points d'un joueur pendant une manche (numérotée à partir de 1). */
export function getRoundPoints(entry: SessionEntry | undefined, round: number): number {
	return entry ? (sumByRound(entry.scores, round)[round - 1] ?? 0) : 0;
}

/**
 * Lignes du récapitulatif, dans l'ordre du classement : les équipes en jeu en équipes (points de
 * leurs joueurs additionnés), sinon les joueurs. `nameOf` : nom affiché d'un joueur.
 */
export function getRoundRecap(
	ranking: { players: RankedEntry[]; teams: RankedTeam[] | null },
	entries: Record<string, SessionEntry>,
	round: number,
	nameOf: (playerId: string) => string,
): RoundRecapLine[] {
	if (ranking.teams) {
		return ranking.teams.map((team) => ({
			id: team.teamId,
			name: team.name,
			rank: team.rank,
			total: team.total,
			roundPoints: sum(team.playerIds.map((id) => getRoundPoints(entries[id], round))),
		}));
	}
	return ranking.players.map((player) => ({
		id: player.playerId,
		name: nameOf(player.playerId),
		rank: player.rank,
		total: player.total,
		roundPoints: getRoundPoints(entries[player.playerId], round),
	}));
}

/** Scores saisis jusqu'à une manche incluse : la partie telle qu'elle était à la fin de celle-ci. */
function entriesUpTo(
	entries: Record<string, SessionEntry>,
	round: number,
): Record<string, SessionEntry> {
	return Object.fromEntries(
		Object.entries(entries).map(([id, entry]) => [
			id,
			{
				...entry,
				scores: Object.fromEntries(
					Object.entries(entry.scores).filter(([key]) => parseScoreKey(key).round <= round),
				),
			},
		]),
	);
}

/**
 * Classement à la fin de chaque manche (index 0 = après la manche 1), avec les mêmes règles que le
 * classement final : totaux cumulés jusque-là, départage et équipes compris.
 */
export function getRoundStandings(
	session: RankableSession,
	roundCount: number,
	nameOf: (playerId: string) => string,
): RoundRecapLine[][] {
	return Array.from({ length: roundCount }, (_, index) => {
		const entries = entriesUpTo(session.entries, index + 1);
		return getRoundRecap(rankSession({ ...session, entries }), entries, index + 1, nameOf);
	});
}
