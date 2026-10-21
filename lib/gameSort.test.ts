import { sortGames } from "@/lib/gameSort";
import { computeGamePlayStats } from "@/lib/stats";
import { makeGame, makeSession } from "@/test/factories";

const games = [
	makeGame({ id: "azul", name: "Azul", createdAt: 1 }),
	makeGame({ id: "skyjo", name: "skyjo", createdAt: 3 }),
	makeGame({ id: "eclat", name: "Éclat", createdAt: 2 }),
	makeGame({ id: "dixit", name: "Dixit", createdAt: 4 }),
];

const stats = computeGamePlayStats([
	makeSession({ id: "s3", gameDefId: "skyjo", createdAt: 30 }),
	makeSession({ id: "s2", gameDefId: "azul", createdAt: 20, finishedAt: 25 }),
	makeSession({ id: "s1", gameDefId: "azul", createdAt: 10 }),
	// Partie d'un jeu supprimé : ignorée.
	makeSession({ id: "s0", gameDefId: "disparu", createdAt: 40 }),
]);

const names = (order: Parameters<typeof sortGames>[1]) =>
	sortGames(games, order, stats).map((g) => g.name);

describe("sortGames", () => {
	it("trie par ordre alphabétique, sans tenir compte de la casse ni des accents", () => {
		expect(names("alpha")).toEqual(["Azul", "Dixit", "Éclat", "skyjo"]);
	});

	it("met les jeux joués récemment en tête, les jamais joués ensuite par nom", () => {
		expect(names("recent")).toEqual(["skyjo", "Azul", "Dixit", "Éclat"]);
	});

	it("met les jeux les plus joués en tête", () => {
		expect(names("mostPlayed")).toEqual(["Azul", "skyjo", "Dixit", "Éclat"]);
	});

	it("met les jeux ajoutés récemment en tête", () => {
		expect(names("newest")).toEqual(["Dixit", "skyjo", "Éclat", "Azul"]);
	});

	it("ne modifie pas la liste reçue", () => {
		const copy = [...games];
		sortGames(games, "alpha", stats);
		expect(games).toEqual(copy);
	});
});
