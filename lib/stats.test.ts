import {
	computeGamePlayStats,
	computeGlobalRecords,
	computePlayerGameStats,
	computePlayerLeaderboard,
	computePlayerRoundAverages,
	computePlayerStats,
	formatAverage,
	formatRate,
	getSessionRanking,
} from "@/lib/stats";
import { makeCategory, makeEntry, makePlayer, makeSession } from "@/test/factories";
import type { Session } from "@/types/game";

/** Partie à deux joueurs : `scores` donne les points de chacun par catégorie. */
function duel(
	id: string,
	finishedAt: number,
	scores: Record<string, Record<string, number>>,
	gameDefId = "azul",
): Session {
	const playerIds = Object.keys(scores);
	return makeSession({
		id,
		gameDefId,
		createdAt: finishedAt - 1,
		finishedAt,
		playerIds,
		entries: Object.fromEntries(playerIds.map((p) => [p, makeEntry(p, scores[p])])),
	});
}

const murs = makeCategory({ id: "murs" });
const malus = makeCategory({ id: "malus" });

// Alice gagne les deux premières, Bob la troisième (la plus récente, stockée en tête).
const history = [
	duel("s3", 300, { alice: { murs: 10 }, bob: { murs: 12 } }),
	duel("s2", 200, { alice: { murs: 20, malus: -4 }, bob: { murs: 15 } }),
	duel("s1", 100, { alice: { murs: 30 }, bob: { murs: 5, malus: -2 } }),
];

describe("getSessionRanking", () => {
	it("classe les joueurs d'une partie et ne recalcule pas le classement d'une même partie", () => {
		const ranking = getSessionRanking(history[0]);

		expect(ranking.map((r) => [r.playerId, r.rank, r.total])).toEqual([
			["bob", 1, 12],
			["alice", 2, 10],
		]);
		expect(getSessionRanking(history[0])).toBe(ranking);
	});

	it("calcule à part le classement d'une autre partie, même de mêmes joueurs", () => {
		const copy = {
			...history[0],
			entries: { ...history[0].entries, alice: makeEntry("alice", { murs: 50 }) },
		};

		expect(getSessionRanking(copy)[0].playerId).toBe("alice");
		expect(getSessionRanking(history[0])[0].playerId).toBe("bob");
	});
});

describe("computePlayerStats", () => {
	it("renvoie des stats vides pour un joueur sans partie", () => {
		expect(computePlayerStats("carole", history)).toMatchObject({ gamesPlayed: 0, winRate: 0 });
	});

	it("agrège victoires, moyenne, meilleur score et moyennes par catégorie", () => {
		expect(computePlayerStats("alice", history, [murs, malus])).toEqual({
			gamesPlayed: 3,
			wins: 2,
			winRate: 2 / 3,
			averageTotal: (10 + 16 + 30) / 3,
			bestTotal: 30,
			averageByCategory: { murs: 20, malus: -4 / 3 },
		});
	});

	it("compte une égalité en tête comme une victoire pour chaque ex æquo", () => {
		const tie = [duel("t", 1, { alice: { murs: 5 }, bob: { murs: 5 } })];
		expect(computePlayerStats("alice", tie).wins).toBe(1);
		expect(computePlayerStats("bob", tie).wins).toBe(1);
	});

	it("garde un meilleur score négatif plutôt que -Infinity", () => {
		const negative = [duel("n", 1, { alice: { malus: -3 }, bob: { malus: -1 } })];
		expect(computePlayerStats("alice", negative).bestTotal).toBe(-3);
	});

	it("prend le plus bas total comme meilleur score quand le plus bas gagne", () => {
		const skyjo = [
			{ ...duel("k1", 1, { alice: { murs: 40 }, bob: { murs: 50 } }), lowestWins: true },
			{ ...duel("k2", 2, { alice: { murs: 12 }, bob: { murs: 3 } }), lowestWins: true },
		];
		expect(computePlayerStats("alice", skyjo)).toMatchObject({ wins: 1, bestTotal: 12 });
	});

	it("compte la victoire de l'équipe pour chacun de ses joueurs", () => {
		const teamGame = {
			...duel("e", 1, { alice: { murs: 1 }, bob: { murs: 9 }, carole: { murs: 5 } }),
			teams: [
				{ id: "t1", name: "A", playerIds: ["alice", "bob"] },
				{ id: "t2", name: "B", playerIds: ["carole"] },
			],
		};
		expect(computePlayerStats("alice", [teamGame]).wins).toBe(1);
		expect(computePlayerStats("carole", [teamGame]).wins).toBe(0);
	});
});

describe("computePlayerRoundAverages", () => {
	it("fait la moyenne de chaque manche, toutes catégories confondues", () => {
		const games = [
			duel("r1", 1, { alice: { murs: 4, malus: -1, "murs#2": 6 }, bob: { murs: 1 } }),
			duel("r2", 2, { alice: { murs: 2, "murs#2": 0 }, bob: { murs: 1 } }),
		];
		expect(computePlayerRoundAverages("alice", games, 2)).toEqual([2.5, 3]);
	});

	it("compte une manche sans points comme 0 tant que la partie l'a jouée", () => {
		const game = duel("r", 1, { alice: { murs: 4 }, bob: { "murs#3": 2 } });
		expect(computePlayerRoundAverages("alice", [game], 1)).toEqual([4, 0, 0]);
	});

	it("ne moyenne une manche que sur les parties qui l'ont atteinte", () => {
		const games = [
			duel("o1", 1, { alice: { murs: 2, "murs#2": 8 }, bob: { murs: 1 } }),
			duel("o2", 2, { alice: { murs: 4 }, bob: { murs: 1 } }),
			duel("o3", 3, { alice: { murs: 9 }, bob: { murs: 0 } }),
		];
		expect(computePlayerRoundAverages("alice", games, 1)).toEqual([5, 8]);
		expect(computePlayerRoundAverages("carole", games, 1)).toEqual([]);
	});
});

describe("computeGlobalRecords", () => {
	it("ne trouve aucun record sans partie", () => {
		expect(computeGlobalRecords([])).toEqual({
			bestScore: null,
			longestWinStreak: null,
			closestGame: null,
		});
	});

	it("trouve le meilleur score, la plus longue série et la partie la plus disputée", () => {
		expect(computeGlobalRecords(history)).toEqual({
			bestScore: { playerId: "alice", total: 30, sessionId: "s1", gameDefId: "azul" },
			longestWinStreak: { playerId: "alice", streak: 2 },
			closestGame: { gap: 1, sessionId: "s2", gameDefId: "azul", playedAt: 200 },
		});
	});

	it("ignore les jeux où le plus bas gagne pour le meilleur score", () => {
		const sessions = [
			{ ...duel("k", 1, { alice: { murs: 99 }, bob: { murs: 98 } }), lowestWins: true },
			duel("a", 2, { alice: { murs: 9 }, bob: { murs: 1 } }),
		];
		expect(computeGlobalRecords(sessions).bestScore?.total).toBe(9);
		expect(computeGlobalRecords(sessions).closestGame?.gap).toBe(1);
	});

	it("mesure l'écart entre les deux premières équipes d'une partie en équipes", () => {
		const teamGame = {
			...duel("e", 1, { alice: { murs: 1 }, bob: { murs: 9 }, carole: { murs: 7 } }),
			teams: [
				{ id: "t1", name: "A", playerIds: ["alice", "bob"] },
				{ id: "t2", name: "B", playerIds: ["carole"] },
			],
		};
		expect(computeGlobalRecords([teamGame]).closestGame?.gap).toBe(3);
	});

	it("ne coupe pas une série sur une partie où le joueur était absent", () => {
		const sessions = [
			duel("a", 1, { alice: { murs: 9 }, bob: { murs: 1 } }),
			duel("b", 2, { bob: { murs: 9 }, carole: { murs: 1 } }),
			duel("c", 3, { alice: { murs: 9 }, carole: { murs: 1 } }),
		];
		expect(computeGlobalRecords(sessions).longestWinStreak).toEqual({
			playerId: "alice",
			streak: 2,
		});
	});
});

describe("computePlayerLeaderboard", () => {
	it("classe par taux de victoire puis par nombre de parties, sans les joueurs absents", () => {
		const players = ["alice", "bob", "carole", "david"].map((id) => makePlayer({ id, name: id }));
		const sessions = [...history, duel("s4", 400, { carole: { murs: 9 }, david: { murs: 1 } })];
		expect(computePlayerLeaderboard(sessions, players).map((e) => e.playerId)).toEqual([
			"carole",
			"alice",
			"bob",
			"david",
		]);
		expect(computePlayerLeaderboard(history, players).map((e) => e.playerId)).toEqual([
			"alice",
			"bob",
		]);
	});
});

describe("computeGamePlayStats", () => {
	it("trie les jeux du plus joué au moins joué, le plus récent d'abord à égalité", () => {
		const sessions = [
			...history,
			duel("k1", 50, { alice: {}, bob: {} }, "kingdomino"),
			duel("q1", 500, { alice: {}, bob: {} }, "quixx"),
		];
		expect(computeGamePlayStats(sessions)).toEqual([
			{ gameDefId: "azul", sessionsPlayed: 3, lastPlayedAt: 300 },
			{ gameDefId: "quixx", sessionsPlayed: 1, lastPlayedAt: 500 },
			{ gameDefId: "kingdomino", sessionsPlayed: 1, lastPlayedAt: 50 },
		]);
	});
});

describe("computePlayerGameStats", () => {
	it("donne les résultats du joueur jeu par jeu, du meilleur taux au moins bon", () => {
		const sessions = [
			...history,
			duel("k1", 50, { alice: { murs: 9 }, bob: { murs: 1 } }, "kingdomino"),
			duel("q1", 500, { bob: {}, carole: {} }, "quixx"),
		];
		expect(computePlayerGameStats("alice", sessions)).toEqual([
			{ gameDefId: "kingdomino", gamesPlayed: 1, wins: 1, winRate: 1 },
			{ gameDefId: "azul", gamesPlayed: 3, wins: 2, winRate: 2 / 3 },
		]);
	});
});

describe("formatage", () => {
	it("affiche une moyenne à une décimale au plus, à la française", () => {
		expect(formatAverage(12.46)).toBe("12,5");
		expect(formatAverage(20)).toBe("20");
		expect(formatAverage(-0.01)).toBe("0");
	});

	it("affiche un taux en pourcentage entier", () => {
		expect(formatRate(2 / 3)).toBe("67%");
	});
});
