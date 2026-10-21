import { computeWidgetSummary, type WidgetData } from "@/lib/widgetSummary";
import { makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";

function data(overrides: Partial<WidgetData> = {}): WidgetData {
	return {
		ongoingGameId: null,
		ongoingPlayerCount: 0,
		sessions: [],
		games: [makeGame({ id: "azul", name: "Azul" })],
		players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
		...overrides,
	};
}

const duel = (scores: Record<string, number>, extra = {}) =>
	makeSession({
		gameDefId: "azul",
		createdAt: new Date(2026, 9, 20).getTime(),
		playerIds: Object.keys(scores),
		entries: Object.fromEntries(
			Object.entries(scores).map(([id, x]) => [id, makeEntry(id, { x })]),
		),
		...extra,
	});

describe("computeWidgetSummary", () => {
	it("propose de reprendre la partie en cours", () => {
		expect(computeWidgetSummary(data({ ongoingGameId: "azul", ongoingPlayerCount: 3 }))).toEqual({
			kind: "ongoing",
			gameName: "Azul",
			playerCount: 3,
		});
	});

	it("montre le vainqueur de la dernière partie", () => {
		const summary = computeWidgetSummary(
			data({ sessions: [duel({ alice: 12, bob: 30 }), duel({ alice: 99, bob: 1 })] }),
		);
		expect(summary).toEqual({
			kind: "lastWinner",
			gameName: "Azul",
			winners: "Bob",
			total: 30,
			date: "20 octobre 2026",
		});
	});

	it("nomme tous les ex æquo, ou l'équipe gagnante", () => {
		const tie = computeWidgetSummary(data({ sessions: [duel({ alice: 5, bob: 5 })] }));
		expect(tie).toMatchObject({ winners: "Alice, Bob" });

		const teams = [
			{ id: "t1", name: "Rouges", playerIds: ["alice"] },
			{ id: "t2", name: "Bleus", playerIds: ["bob"] },
		];
		const team = computeWidgetSummary(data({ sessions: [duel({ alice: 5, bob: 8 }, { teams })] }));
		expect(team).toMatchObject({ winners: "Bleus", total: 8 });
	});

	it("reste vide sans aucune partie", () => {
		expect(computeWidgetSummary(data())).toEqual({ kind: "empty" });
	});
});
