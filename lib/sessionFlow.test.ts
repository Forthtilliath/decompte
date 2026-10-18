import { getReplayPlan, getResumeCategoryId } from "@/lib/sessionFlow";
import { makeCategory, makeGame, makePlayer, makeSession } from "@/test/factories";

describe("getResumeCategoryId", () => {
	const game = makeGame({
		categories: [
			makeCategory({ id: "c1" }),
			makeCategory({ id: "c2" }),
			makeCategory({ id: "c3" }),
		],
	});

	it("reprend sur la dernière étape affichée", () => {
		expect(getResumeCategoryId(game, "c2")).toBe("c2");
	});

	it("reprend sur la première étape si aucune n'a été mémorisée", () => {
		expect(getResumeCategoryId(game, null)).toBe("c1");
	});

	it("reprend sur la première étape si la catégorie mémorisée a disparu du jeu", () => {
		expect(getResumeCategoryId(game, "supprimee")).toBe("c1");
	});
});

describe("getReplayPlan", () => {
	const players = [
		makePlayer({ id: "p1" }),
		makePlayer({ id: "p2" }),
		makePlayer({ id: "p3" }),
		makePlayer({ id: "archive", isArchived: true }),
	];

	it("rejoue avec tous les joueurs quand ils sont tous disponibles", () => {
		const plan = getReplayPlan(
			makeSession({ playerIds: ["p1", "p2"] }),
			makeGame({ minPlayers: 2, maxPlayers: 4 }),
			players,
		);
		expect(plan).toEqual({ ok: true, playerIds: ["p1", "p2"], isPartial: false });
	});

	it("écarte les joueurs archivés depuis et signale une partie partielle", () => {
		const plan = getReplayPlan(
			makeSession({ playerIds: ["p1", "archive", "p2"] }),
			makeGame({ minPlayers: 2, maxPlayers: 4 }),
			players,
		);
		expect(plan).toEqual({ ok: true, playerIds: ["p1", "p2"], isPartial: true });
	});

	it("écarte les joueurs supprimés (introuvables)", () => {
		const plan = getReplayPlan(
			makeSession({ playerIds: ["p1", "fantome", "p2"] }),
			makeGame({ minPlayers: 1, maxPlayers: 4 }),
			players,
		);
		expect(plan).toEqual({ ok: true, playerIds: ["p1", "p2"], isPartial: true });
	});

	it("respecte le maximum actuel du jeu, abaissé depuis la partie", () => {
		const plan = getReplayPlan(
			makeSession({ playerIds: ["p1", "p2", "p3"] }),
			makeGame({ minPlayers: 1, maxPlayers: 2 }),
			players,
		);
		expect(plan).toEqual({ ok: true, playerIds: ["p1", "p2"], isPartial: true });
	});

	it("refuse s'il ne reste pas assez de joueurs pour le minimum du jeu", () => {
		const plan = getReplayPlan(
			makeSession({ playerIds: ["p1", "archive"] }),
			makeGame({ minPlayers: 2, maxPlayers: 4 }),
			players,
		);
		expect(plan).toEqual({
			ok: false,
			reason: "Il faut au moins 2 joueur(s) disponible(s) parmi ceux de cette partie.",
		});
	});
});
