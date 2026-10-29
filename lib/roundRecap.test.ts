import { getRoundPoints, getRoundRecap, getRoundStandings } from "@/lib/roundRecap";
import { rankSession } from "@/lib/scoring";
import { makeEntry } from "@/test/factories";

const entries = {
	alice: makeEntry("alice", { cartes: 4, "cartes#2": 7 }),
	bob: makeEntry("bob", { cartes: 0, "cartes#2": 2 }),
	chloe: makeEntry("chloe", { cartes: 9, "cartes#2": 0 }),
};
const nameOf = (id: string) => id.toUpperCase();

describe("getRoundPoints", () => {
	it("donne les points d'une seule manche", () => {
		expect(getRoundPoints(entries.alice, 1)).toBe(4);
		expect(getRoundPoints(entries.alice, 2)).toBe(7);
	});

	it("vaut 0 pour une manche sans score ou un joueur absent", () => {
		expect(getRoundPoints(entries.alice, 3)).toBe(0);
		expect(getRoundPoints(undefined, 1)).toBe(0);
	});
});

describe("getRoundRecap", () => {
	it("suit le classement des joueurs, avec leur total et les points de la manche", () => {
		const ranking = rankSession({
			playerIds: ["alice", "bob", "chloe"],
			entries,
			lowestWins: true,
		});
		expect(getRoundRecap(ranking, entries, 2, nameOf)).toEqual([
			{ id: "bob", name: "BOB", rank: 1, total: 2, roundPoints: 2 },
			{ id: "chloe", name: "CHLOE", rank: 2, total: 9, roundPoints: 0 },
			{ id: "alice", name: "ALICE", rank: 3, total: 11, roundPoints: 7 },
		]);
	});

	it("additionne les joueurs de chaque équipe en jeu en équipes", () => {
		const ranking = rankSession({
			playerIds: ["alice", "bob", "chloe"],
			entries,
			teams: [
				{ id: "t1", name: "Rouges", playerIds: ["alice", "bob"] },
				{ id: "t2", name: "Bleus", playerIds: ["chloe"] },
			],
		});
		expect(getRoundRecap(ranking, entries, 2, nameOf)).toEqual([
			{ id: "t1", name: "Rouges", rank: 1, total: 13, roundPoints: 9 },
			{ id: "t2", name: "Bleus", rank: 2, total: 9, roundPoints: 0 },
		]);
	});
});

describe("getRoundStandings", () => {
	it("reclasse les joueurs à la fin de chaque manche, sur leurs totaux cumulés", () => {
		const standings = getRoundStandings(
			{ playerIds: ["alice", "bob", "chloe"], entries, lowestWins: true },
			2,
			nameOf,
		);
		expect(standings[0]).toEqual([
			{ id: "bob", name: "BOB", rank: 1, total: 0, roundPoints: 0 },
			{ id: "alice", name: "ALICE", rank: 2, total: 4, roundPoints: 4 },
			{ id: "chloe", name: "CHLOE", rank: 3, total: 9, roundPoints: 9 },
		]);
		expect(standings[1].map((line) => [line.id, line.rank, line.total])).toEqual([
			["bob", 1, 2],
			["chloe", 2, 9],
			["alice", 3, 11],
		]);
	});
});
