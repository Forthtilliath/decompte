import {
	getFirstStepHref,
	getMissingSteps,
	getReplayPlan,
	getResumeStep,
	getScoringSteps,
	getStepHref,
} from "@/lib/sessionFlow";
import { makeCategory, makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";

const categories = [
	makeCategory({ id: "c1" }),
	makeCategory({ id: "c2" }),
	makeCategory({ id: "c3" }),
];

describe("getScoringSteps", () => {
	it("enchaîne les catégories une seule fois pour un jeu sans manches", () => {
		expect(getScoringSteps(makeGame({ categories }))).toEqual([
			{ categoryId: "c1", round: 1 },
			{ categoryId: "c2", round: 1 },
			{ categoryId: "c3", round: 1 },
		]);
	});

	it("rejoue toutes les catégories à chaque manche, manche après manche", () => {
		const steps = getScoringSteps(makeGame({ categories: categories.slice(0, 2), rounds: 3 }));
		expect(steps.map((s) => `${s.categoryId}/${s.round}`)).toEqual([
			"c1/1",
			"c2/1",
			"c1/2",
			"c2/2",
			"c1/3",
			"c2/3",
		]);
	});
});

describe("getStepHref", () => {
	it("met toujours la manche dans l'URL, même la première", () => {
		expect(getStepHref({ categoryId: "c2", round: 3 })).toBe("/jeux/play/c2?round=3");
		expect(getFirstStepHref(makeGame({ categories }))).toBe("/jeux/play/c1?round=1");
	});
});

describe("getResumeStep", () => {
	const game = makeGame({ categories, rounds: 2 });

	it("reprend sur la dernière étape affichée", () => {
		expect(getResumeStep(game, "c2", 2)).toEqual({ categoryId: "c2", round: 2 });
	});

	it("reprend en manche 1 une partie enregistrée avant les manches", () => {
		expect(getResumeStep(game, "c2", null)).toEqual({ categoryId: "c2", round: 1 });
	});

	it("reprend sur la première étape si aucune n'a été mémorisée", () => {
		expect(getResumeStep(game, null, null)).toEqual({ categoryId: "c1", round: 1 });
	});

	it("reprend sur la première étape si la catégorie ou la manche a disparu du jeu", () => {
		expect(getResumeStep(game, "supprimee", 1)).toEqual({ categoryId: "c1", round: 1 });
		expect(getResumeStep(game, "c2", 3)).toEqual({ categoryId: "c1", round: 1 });
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

describe("getMissingSteps", () => {
	const game = makeGame({ categories: categories.slice(0, 2), rounds: 2 });

	it("liste les étapes vides et leurs joueurs, dans l'ordre de la partie", () => {
		const entries = {
			a: makeEntry("a", { c1: 3, c2: 0, "c1#2": 1 }),
			b: makeEntry("b", { c1: 0 }),
		};
		expect(getMissingSteps(game, ["a", "b"], entries)).toEqual([
			{ categoryId: "c2", round: 1, playerIds: ["b"] },
			{ categoryId: "c1", round: 2, playerIds: ["b"] },
			{ categoryId: "c2", round: 2, playerIds: ["a", "b"] },
		]);
	});

	it("ne signale rien quand tout est saisi, même à 0", () => {
		const scores = { c1: 0, c2: 0, "c1#2": 0, "c2#2": 0 };
		expect(getMissingSteps(game, ["a"], { a: makeEntry("a", scores) })).toEqual([]);
	});
});
