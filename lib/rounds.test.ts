import { getRoundCount, parseScoreKey, scoreKey, sumByCategory, sumByRound } from "@/lib/rounds";
import { makeGame } from "@/test/factories";

describe("getRoundCount", () => {
	it("lit le nombre de manches, 1 pour un jeu créé avant les manches", () => {
		expect(getRoundCount(makeGame({ rounds: 3 }))).toBe(3);
		expect(getRoundCount(makeGame())).toBe(1);
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
