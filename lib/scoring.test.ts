import { computeEntryTotal, rankEntries } from "@/lib/scoring";
import { makeEntry } from "@/test/factories";

describe("computeEntryTotal", () => {
	it("vaut 0 tant que rien n'est saisi", () => {
		expect(computeEntryTotal(makeEntry("p1"))).toBe(0);
	});

	it("additionne toutes les catégories, négatives comprises", () => {
		expect(computeEntryTotal(makeEntry("p1", { a: 10, b: -3, c: 0, d: 7 }))).toBe(14);
	});

	it("compte aussi les scores de catégories supprimées depuis (historique figé)", () => {
		expect(computeEntryTotal(makeEntry("p1", { "categorie-supprimee": 5, actuelle: 2 }))).toBe(7);
	});
});

describe("rankEntries", () => {
	it("retourne une liste vide sans joueur", () => {
		expect(rankEntries([])).toEqual([]);
	});

	it("classe par total décroissant", () => {
		const ranking = rankEntries([
			makeEntry("bas", { a: 1 }),
			makeEntry("haut", { a: 30 }),
			makeEntry("milieu", { a: 12 }),
		]);
		expect(ranking).toEqual([
			{ playerId: "haut", total: 30, rank: 1 },
			{ playerId: "milieu", total: 12, rank: 2 },
			{ playerId: "bas", total: 1, rank: 3 },
		]);
	});

	it("partage le rang en cas d'égalité et saute le suivant (1, 2, 2, 4)", () => {
		const ranking = rankEntries([
			makeEntry("a", { x: 50 }),
			makeEntry("b", { x: 20 }),
			makeEntry("c", { x: 20 }),
			makeEntry("d", { x: 5 }),
		]);
		expect(ranking.map((r) => r.rank)).toEqual([1, 2, 2, 4]);
	});

	it("gère une égalité en tête", () => {
		const ranking = rankEntries([
			makeEntry("a", { x: 9 }),
			makeEntry("b", { x: 9 }),
			makeEntry("c", { x: 1 }),
		]);
		expect(ranking.map((r) => r.rank)).toEqual([1, 1, 3]);
	});

	it("garde l'ordre de saisie entre ex aequo (tri stable)", () => {
		const ranking = rankEntries([makeEntry("premier"), makeEntry("second")]);
		expect(ranking.map((r) => r.playerId)).toEqual(["premier", "second"]);
	});

	it("classe correctement des totaux négatifs", () => {
		const ranking = rankEntries([makeEntry("a", { x: -10 }), makeEntry("b", { x: -2 })]);
		expect(ranking.map((r) => r.playerId)).toEqual(["b", "a"]);
	});

	it("ne modifie pas le tableau reçu", () => {
		const entries = [makeEntry("a", { x: 1 }), makeEntry("b", { x: 2 })];
		rankEntries(entries);
		expect(entries.map((e) => e.playerId)).toEqual(["a", "b"]);
	});
});
