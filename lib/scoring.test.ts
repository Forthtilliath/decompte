import { computeEntryTotal, rankEntries, rankSession } from "@/lib/scoring";
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

	it("classe par total croissant quand le plus bas gagne", () => {
		const ranking = rankEntries(
			[makeEntry("a", { x: 30 }), makeEntry("b", { x: -5 }), makeEntry("c", { x: 30 })],
			{ lowestWins: true },
		);
		expect(ranking.map((r) => [r.playerId, r.rank])).toEqual([
			["b", 1],
			["a", 2],
			["c", 2],
		]);
	});

	it("départage deux totaux égaux par la catégorie choisie, toutes manches confondues", () => {
		const ranking = rankEntries(
			[
				makeEntry("a", { murs: 5, pieces: 5 }),
				makeEntry("b", { murs: 2, pieces: 4, "pieces#2": 4 }),
				makeEntry("c", { murs: 9, pieces: 1 }),
			],
			{ tieBreakerId: "pieces" },
		);
		expect(ranking.map((r) => [r.playerId, r.rank])).toEqual([
			["b", 1],
			["a", 2],
			["c", 3],
		]);
	});

	it("garde l'ex æquo si le départage est lui aussi égal", () => {
		const ranking = rankEntries([makeEntry("a", { x: 5, y: 1 }), makeEntry("b", { x: 5, y: 1 })], {
			tieBreakerId: "y",
		});
		expect(ranking.map((r) => r.rank)).toEqual([1, 1]);
	});
});

describe("rankSession", () => {
	const entries = {
		a: makeEntry("a", { x: 10 }),
		b: makeEntry("b", { x: 1 }),
		c: makeEntry("c", { x: 6 }),
		d: makeEntry("d", { x: 6 }),
	};
	const teams = [
		{ id: "t1", name: "Rouges", playerIds: ["a", "b"] },
		{ id: "t2", name: "Bleus", playerIds: ["c", "d"] },
	];

	it("sans équipes, classe les joueurs chacun pour soi", () => {
		const ranking = rankSession({ playerIds: ["a", "b"], entries });
		expect(ranking.teams).toBeNull();
		expect(ranking.players.map((r) => r.playerId)).toEqual(["a", "b"]);
	});

	it("classe les équipes sur la somme de leurs joueurs, chacun prenant le rang de son équipe", () => {
		const ranking = rankSession({ playerIds: ["a", "b", "c", "d"], entries, teams });
		expect(ranking.teams?.map((t) => [t.name, t.total, t.rank])).toEqual([
			["Bleus", 12, 1],
			["Rouges", 11, 2],
		]);
		expect(ranking.players.map((r) => [r.playerId, r.total, r.rank])).toEqual([
			["c", 6, 1],
			["d", 6, 1],
			["a", 10, 2],
			["b", 1, 2],
		]);
	});

	it("applique le plus bas gagne aux équipes", () => {
		const ranking = rankSession({
			playerIds: ["a", "b", "c", "d"],
			entries,
			teams,
			lowestWins: true,
		});
		expect(ranking.teams?.[0].name).toBe("Rouges");
	});

	it("classe à part un joueur sans équipe, hors classement des équipes", () => {
		const ranking = rankSession({
			playerIds: ["a", "b", "c", "d"],
			entries,
			teams: [teams[0], { id: "t2", name: "Bleus", playerIds: ["c"] }],
		});
		expect(ranking.teams?.map((t) => t.name)).toEqual(["Rouges", "Bleus"]);
		expect(ranking.players.find((r) => r.playerId === "d")?.rank).toBe(2);
	});
});
