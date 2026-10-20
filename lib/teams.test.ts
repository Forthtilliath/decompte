import { buildTeams, playersByTeam, replayTeams, teamOf } from "@/lib/teams";

describe("teamOf", () => {
	it("répartit à tour de rôle dans l'ordre de sélection", () => {
		const ids = ["a", "b", "c", "d", "e"];
		expect(ids.map((id) => teamOf({}, ids, id, 2))).toEqual([0, 1, 0, 1, 0]);
	});

	it("garde l'équipe choisie, sauf si elle n'existe plus", () => {
		expect(teamOf({ a: 2 }, ["a"], "a", 3)).toBe(2);
		expect(teamOf({ a: 2 }, ["a"], "a", 2)).toBe(0);
	});
});

describe("buildTeams", () => {
	it("nomme les équipes dans l'ordre et retire les équipes vides", () => {
		const teams = buildTeams(["a", "b", "c"], { a: 2, b: 2, c: 0 }, 3);
		expect(teams.map((t) => [t.name, t.playerIds])).toEqual([
			["Équipe 1", ["c"]],
			["Équipe 3", ["a", "b"]],
		]);
		expect(new Set(teams.map((t) => t.id)).size).toBe(2);
		expect(playersByTeam(teams)).toEqual(["c", "a", "b"]);
	});
});

describe("replayTeams", () => {
	const teams = [
		{ id: "t1", name: "Rouges", playerIds: ["a", "b"] },
		{ id: "t2", name: "Bleus", playerIds: ["c", "d"] },
	];

	it("reprend les équipes avec les joueurs encore disponibles", () => {
		const replayed = replayTeams(teams, ["a", "c", "d"]);
		expect(replayed?.map((t) => [t.name, t.playerIds])).toEqual([
			["Rouges", ["a"]],
			["Bleus", ["c", "d"]],
		]);
	});

	it("renonce s'il reste moins de deux équipes ou si un joueur n'en a pas", () => {
		expect(replayTeams(teams, ["a", "b"])).toBeNull();
		expect(replayTeams(undefined, ["a", "b"])).toBeNull();
		expect(replayTeams(teams, ["a", "c", "z"])).toBeNull();
	});
});
