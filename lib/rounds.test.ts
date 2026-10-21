import {
	describeRounds,
	getLastScoredRound,
	getRoundCount,
	getScoreLimitReachers,
	getSessionRoundCount,
	parseScoreKey,
	scoreKey,
	sumByCategory,
	sumByRound,
} from "@/lib/rounds";
import { makeEntry, makeGame } from "@/test/factories";

describe("getRoundCount", () => {
	it("lit le nombre de manches, 1 pour un jeu créé avant les manches", () => {
		expect(getRoundCount(makeGame({ rounds: 3 }))).toBe(3);
		expect(getRoundCount(makeGame())).toBe(1);
	});
});

describe("getSessionRoundCount", () => {
	it("prend les manches commencées en manches ouvertes, sinon celles du jeu", () => {
		const game = makeGame({ rounds: 3 });
		expect(getSessionRoundCount(game, 5)).toBe(5);
		expect(getSessionRoundCount(game, null)).toBe(3);
	});
});

describe("describeRounds", () => {
	it("décrit chaque mode de fin de partie", () => {
		expect(describeRounds(makeGame({ rounds: 3 }))).toBe("3 manches");
		expect(describeRounds(makeGame({ openRounds: { scoreLimit: 15 } }))).toBe("jusqu'à 15 points");
		expect(describeRounds(makeGame({ openRounds: {} }))).toBe("manches libres");
	});

	it("ne dit rien d'un jeu en une manche", () => {
		expect(describeRounds(makeGame())).toBeNull();
	});
});

describe("getLastScoredRound", () => {
	it("trouve la dernière manche saisie, tous joueurs confondus", () => {
		const entries = [makeEntry("a", { murs: 1, "murs#2": 3 }), makeEntry("b", { "murs#4": 0 })];
		expect(getLastScoredRound(entries)).toBe(4);
	});

	it("vaut 1 pour une partie sans aucun score", () => {
		expect(getLastScoredRound([makeEntry("a")])).toBe(1);
		expect(getLastScoredRound([])).toBe(1);
	});
});

describe("getScoreLimitReachers", () => {
	const contenders = [
		{ id: "a", total: 16 },
		{ id: "b", total: 15 },
		{ id: "c", total: 14 },
	];

	it("retient les totaux qui atteignent ou dépassent le seuil", () => {
		expect(getScoreLimitReachers(contenders, 15).map((c) => c.id)).toEqual(["a", "b"]);
	});

	it("ne retient personne sans seuil", () => {
		expect(getScoreLimitReachers(contenders, undefined)).toEqual([]);
	});
});

describe("scoreKey / parseScoreKey", () => {
	it("garde l'id seul en manche 1, compatible avec les parties déjà jouées", () => {
		expect(scoreKey("murs", 1)).toBe("murs");
		expect(parseScoreKey("murs")).toEqual({ categoryId: "murs", round: 1 });
	});

	it("ajoute la manche à partir de la deuxième", () => {
		expect(scoreKey("murs", 3)).toBe("murs#3");
		expect(parseScoreKey("murs#3")).toEqual({ categoryId: "murs", round: 3 });
	});
});

describe("sumByCategory", () => {
	it("additionne les manches de chaque catégorie", () => {
		expect(sumByCategory({ murs: 4, "murs#2": 6, bonus: -1, "bonus#3": 3 })).toEqual({
			murs: 10,
			bonus: 2,
		});
	});
});

describe("sumByRound", () => {
	it("donne le total de chaque manche, y compris celles sans points saisis", () => {
		expect(sumByRound({ murs: 4, bonus: 1, "murs#2": 6 }, 3)).toEqual([5, 6, 0]);
	});

	it("garde les manches jouées au-delà du nombre actuel de manches du jeu", () => {
		expect(sumByRound({ murs: 4, "murs#3": 2 }, 1)).toEqual([4, 0, 2]);
	});

	it("donne une seule manche pour une partie vide", () => {
		expect(sumByRound({}, 1)).toEqual([0]);
	});
});
