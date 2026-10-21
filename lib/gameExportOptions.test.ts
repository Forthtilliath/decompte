import {
	GAME_EXPORT_FORMAT,
	GAME_EXPORT_VERSION,
	parseGameExport,
	serializeGame,
} from "@/lib/gameExport";
import { makeCategory, makeGame } from "@/test/factories";

// Options de classement d'un jeu partagé (le reste du format : gameExport.test.ts).

const categories = [
	makeCategory({ id: "a", label: "Points" }),
	makeCategory({ id: "b", label: "Pièces" }),
];

function envelope(game: Record<string, unknown>): string {
	return JSON.stringify({
		format: GAME_EXPORT_FORMAT,
		version: GAME_EXPORT_VERSION,
		game: {
			name: "Skyjo",
			minPlayers: 2,
			maxPlayers: 8,
			categories: [
				{ label: "A", brick: { kind: "manual", allowNegative: true } },
				{ label: "B", brick: { kind: "manual", allowNegative: true } },
			],
			...game,
		},
	});
}

describe("options de classement d'un jeu partagé", () => {
	it("transmet le plus bas gagne, les équipes et le départage, par position", () => {
		const text = serializeGame(
			makeGame({ categories, lowestWins: true, teamPlay: true, tieBreakerId: "b" }),
		);
		expect(text).toContain('"tieBreaker":1');
		expect(text).not.toContain('"b"');

		const result = parseGameExport(text);
		if (!result.ok) throw new Error(result.error);
		expect(result.game).toMatchObject({ lowestWins: true, teamPlay: true });
		expect(result.game.tieBreakerId).toBe(result.game.categories[1].id);
	});

	it("n'écrit aucune option pour un jeu ordinaire", () => {
		const text = serializeGame(makeGame({ categories }));
		expect(text).not.toMatch(/lowestWins|teamPlay|tieBreaker/);
		const result = parseGameExport(text);
		if (!result.ok) throw new Error(result.error);
		expect(result.game).not.toHaveProperty("tieBreakerId");
	});

	it("donne un id à chaque catégorie importée", () => {
		const result = parseGameExport(envelope({}));
		if (!result.ok) throw new Error(result.error);
		const ids = result.game.categories.map((c) => c.id);
		expect(new Set(ids).size).toBe(2);
	});

	it("transmet un multiplicateur en désignant sa catégorie par position", () => {
		const game = makeGame({
			categories: [
				...categories,
				makeCategory({ id: "c", label: "Bonus", brick: { kind: "product", sourceId: "b" } }),
			],
		});
		const text = serializeGame(game);
		expect(text).toContain('"brick":{"kind":"product","source":1}');

		const result = parseGameExport(text);
		if (!result.ok) throw new Error(result.error);
		const [, pieces, bonus] = result.game.categories;
		expect(bonus.brick).toEqual({ kind: "product", sourceId: pieces.id });
	});

	it("refuse un multiplicateur sur lui-même ou sur une catégorie placée après lui", () => {
		const productOn = (source: number) =>
			envelope({
				categories: [
					{ label: "A", brick: { kind: "product", source } },
					{ label: "B", brick: { kind: "manual", allowNegative: false } },
				],
			});
		for (const source of [0, 1]) {
			expect(parseGameExport(productOn(source))).toEqual({
				ok: false,
				error: "Jeu invalide : catégories incorrect.",
			});
		}
	});

	it.each([
		["un départage hors des catégories", { tieBreaker: 2 }, "départage"],
		["un départage négatif", { tieBreaker: -1 }, "départage"],
		["un plus bas gagne qui n'est pas un booléen", { lowestWins: "oui" }, "le plus bas gagne"],
		["des équipes qui ne sont pas un booléen", { teamPlay: 1 }, "jeu en équipes"],
	])("refuse %s", (_, game, field) => {
		const result = parseGameExport(envelope(game));
		expect(result).toEqual({ ok: false, error: `Jeu invalide : ${field} incorrect.` });
	});
});

describe("manches ouvertes d'un jeu partagé", () => {
	it("transmet le seuil de fin de partie ou des manches libres", () => {
		for (const openRounds of [{ scoreLimit: 15 }, {}]) {
			const result = parseGameExport(serializeGame(makeGame({ categories, openRounds })));
			if (!result.ok) throw new Error(result.error);
			expect(result.game.openRounds).toEqual(openRounds);
		}
	});

	it("n'en écrit rien pour un jeu à manches fixes", () => {
		expect(serializeGame(makeGame({ categories, rounds: 3 }))).not.toMatch(/openRounds/);
	});

	it.each([
		[
			"un seuil nul",
			{ openRounds: { scoreLimit: 0 } },
			"manches ouvertes › seuil de fin de partie",
		],
		[
			"un seuil trop grand",
			{ openRounds: { scoreLimit: 10_001 } },
			"manches ouvertes › seuil de fin de partie",
		],
		[
			"un seuil décimal",
			{ openRounds: { scoreLimit: 12.5 } },
			"manches ouvertes › seuil de fin de partie",
		],
		[
			"un seuil en texte",
			{ openRounds: { scoreLimit: "15" } },
			"manches ouvertes › seuil de fin de partie",
		],
		["des manches ouvertes qui ne sont pas un objet", { openRounds: "oui" }, "manches ouvertes"],
	])("refuse %s", (_, game, field) => {
		const result = parseGameExport(envelope(game));
		expect(result).toEqual({ ok: false, error: `Jeu invalide : ${field} incorrect.` });
	});
});
