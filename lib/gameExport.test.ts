import {
	GAME_EXPORT_FORMAT,
	GAME_EXPORT_VERSION,
	MAX_EXPORT_LENGTH,
	paletteColor,
	parseGameExport,
	serializeGame,
} from "@/lib/gameExport";
import { makeCategory, makeGame } from "@/test/factories";

function envelope(game: unknown, overrides: Record<string, unknown> = {}): string {
	return JSON.stringify({
		format: GAME_EXPORT_FORMAT,
		version: GAME_EXPORT_VERSION,
		game,
		...overrides,
	});
}

const validGame = {
	name: "Terraforming Mars",
	minPlayers: 1,
	maxPlayers: 5,
	categories: [
		{ label: "Note de terraformation", brick: { kind: "manual", allowNegative: false } },
	],
};

function expectError(text: string): string {
	const result = parseGameExport(text);
	if (result.ok) throw new Error("import accepté à tort");
	return result.error;
}

describe("serializeGame / parseGameExport", () => {
	it("restitue un jeu exporté, toutes briques confondues", () => {
		const game = makeGame({
			categories: [
				makeCategory({
					id: "a",
					label: "Points",
					brick: { kind: "manual", allowNegative: true, max: 50, unitValue: -4 },
				}),
				makeCategory({
					id: "b",
					label: "Jetons",
					brick: { kind: "tokens", tokens: [{ label: "+3", value: 3 }] },
				}),
				makeCategory({
					id: "c",
					label: "Palier",
					brick: {
						kind: "choice",
						options: [
							{ id: "o1", label: "Bas", value: 0 },
							{ id: "o2", label: "Haut", value: 5 },
						],
					},
				}),
				makeCategory({
					id: "d",
					label: "Bonus",
					brick: { kind: "boolean", yesValue: 2, noValue: 0 },
				}),
			],
		});

		const result = parseGameExport(serializeGame(game));

		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.game.name).toBe("Azul");
		expect(result.game.minPlayers).toBe(2);
		expect(result.game.maxPlayers).toBe(4);
		expect(result.game.categories.map((c) => c.label)).toEqual([
			"Points",
			"Jetons",
			"Palier",
			"Bonus",
		]);
		expect(result.game.categories[0].brick).toEqual({
			kind: "manual",
			allowNegative: true,
			max: 50,
			unitValue: -4,
		});
		expect(result.game.categories[3].brick).toEqual({ kind: "boolean", yesValue: 2, noValue: 0 });
	});

	it("n'exporte ni id, ni date, ni archivage", () => {
		const text = serializeGame(makeGame({ isArchived: true, createdAt: 123 }));

		expect(text).not.toMatch(/"id"|createdAt|isArchived/);
	});

	it("transmet la couleur choisie de chaque catégorie", () => {
		const game = makeGame({
			categories: [
				makeCategory({ color: "#3b82f6" }),
				makeCategory({ id: "c2", color: "#78716c" }),
			],
		});
		const result = parseGameExport(serializeGame(game));

		if (!result.ok) throw new Error(result.error);
		expect(result.game.categories.map((c) => c.color)).toEqual(["#3b82f6", "#78716c"]);
	});

	it("n'exporte pas une couleur hors palette (venue d'une sauvegarde)", () => {
		const text = serializeGame(makeGame({ categories: [makeCategory({ color: "#123456" })] }));

		expect(text).not.toMatch(/color/);
		expect(parseGameExport(text).ok).toBe(true);
	});

	it("refuse une couleur hors palette", () => {
		const category = { ...validGame.categories[0], color: "#ffffff" };
		expect(expectError(envelope({ ...validGame, categories: [category] }))).toMatch(/incorrect/);
		const notAColor = { ...validGame.categories[0], color: "url(javascript:1)" };
		expect(expectError(envelope({ ...validGame, categories: [notAColor] }))).toMatch(/incorrect/);
	});

	it("régénère les id des options et attribue les couleurs par position", () => {
		const choice = {
			kind: "choice",
			options: [
				{ id: "piege", label: "A", value: 1 },
				{ id: "piege", label: "B", value: 2 },
			],
		};
		const result = parseGameExport(
			envelope({
				...validGame,
				categories: [validGame.categories[0], { label: "C", brick: choice }],
			}),
		);

		if (!result.ok) throw new Error(result.error);
		const brick = result.game.categories[1].brick;
		if (brick.kind !== "choice") throw new Error("brique inattendue");
		expect(brick.options[0].id).not.toBe("piege");
		expect(brick.options[0].id).not.toBe(brick.options[1].id);
		expect(result.game.categories.map((c) => c.color)).toEqual([paletteColor(0), paletteColor(1)]);
	});

	it("supprime les clés inconnues", () => {
		const result = parseGameExport(
			envelope({ ...validGame, id: "x", isArchived: true, extra: { deep: 1 } }, { author: "?" }),
		);

		if (!result.ok) throw new Error(result.error);
		expect(Object.keys(result.game).sort()).toEqual([
			"categories",
			"maxPlayers",
			"minPlayers",
			"name",
			"rounds",
		]);
	});

	it("transmet le nombre de manches, et lit un jeu sans manches comme un jeu en une manche", () => {
		const exported = parseGameExport(serializeGame(makeGame({ rounds: 3 })));
		if (!exported.ok) throw new Error(exported.error);
		expect(exported.game.rounds).toBe(3);

		expect(serializeGame(makeGame({ rounds: 1 }))).not.toMatch(/rounds/);
		const legacy = parseGameExport(envelope(validGame));
		if (!legacy.ok) throw new Error(legacy.error);
		expect(legacy.game.rounds).toBe(1);
	});

	it("nettoie les espaces des libellés", () => {
		const result = parseGameExport(envelope({ ...validGame, name: "  Azul  " }));

		if (!result.ok) throw new Error(result.error);
		expect(result.game.name).toBe("Azul");
	});
});

describe("parseGameExport : rejets", () => {
	it("refuse un texte vide, illisible ou trop long", () => {
		expect(expectError("   ")).toMatch(/Colle/);
		expect(expectError("{pas du json")).toMatch(/illisible/);
		expect(expectError(" ".repeat(10) + "x".repeat(MAX_EXPORT_LENGTH + 1))).toMatch(/trop long/);
	});

	it("refuse un autre format ou une valeur JSON qui n'est pas un objet", () => {
		expect(expectError(envelope(validGame, { format: "autre" }))).toBe(
			"Ce texte n'est pas un jeu Décompte.",
		);
		expect(expectError("null")).toBe("Ce texte n'est pas un jeu Décompte.");
		expect(expectError("[]")).toBe("Ce texte n'est pas un jeu Décompte.");
	});

	it("signale un jeu venu d'une version plus récente", () => {
		expect(expectError(envelope(validGame, { version: GAME_EXPORT_VERSION + 1 }))).toMatch(
			/plus récente/,
		);
	});

	it("indique le champ fautif", () => {
		const categories = [{ label: "", brick: { kind: "manual", allowNegative: false } }];

		expect(expectError(envelope({ ...validGame, categories }))).toBe(
			"Jeu invalide : catégories n° 1 › libellé incorrect.",
		);
	});

	it.each([
		["nom vide", { name: "   " }],
		["nom trop long", { name: "x".repeat(61) }],
		["joueurs max < min", { minPlayers: 4, maxPlayers: 2 }],
		["joueurs non entiers", { minPlayers: 1.5 }],
		["trop de joueurs", { maxPlayers: 51 }],
		["aucune manche", { rounds: 0 }],
		["trop de manches", { rounds: 21 }],
		["manches non entières", { rounds: 2.5 }],
		["manches non numériques", { rounds: "3" }],
		["aucune catégorie", { categories: [] }],
		["trop de catégories", { categories: Array(31).fill(validGame.categories[0]) }],
		["mode de calcul inconnu", { categories: [{ label: "A", brick: { kind: "script" } }] }],
		[
			"score hors bornes",
			{ categories: [{ label: "A", brick: { kind: "boolean", yesValue: 1e9, noValue: 0 } }] },
		],
		[
			"score non numérique",
			{ categories: [{ label: "A", brick: { kind: "boolean", yesValue: "1", noValue: 0 } }] },
		],
		["jetons vides", { categories: [{ label: "A", brick: { kind: "tokens", tokens: [] } }] }],
		[
			"une seule valeur de choix",
			{
				categories: [
					{ label: "A", brick: { kind: "choice", options: [{ label: "x", value: 1 }] } },
				],
			},
		],
		[
			"deux valeurs de choix au même score",
			{
				categories: [
					{
						label: "A",
						brick: {
							kind: "choice",
							options: [
								{ label: "x", value: 2 },
								{ label: "y", value: 2 },
							],
						},
					},
				],
			},
		],
		[
			"Oui et Non au même score",
			{ categories: [{ label: "A", brick: { kind: "boolean", yesValue: 0, noValue: 0 } }] },
		],
		[
			"unité à 0 point",
			{
				categories: [{ label: "A", brick: { kind: "manual", allowNegative: false, unitValue: 0 } }],
			},
		],
		[
			"unité décimale",
			{
				categories: [
					{ label: "A", brick: { kind: "manual", allowNegative: false, unitValue: 1.5 } },
				],
			},
		],
		[
			"plafond négatif",
			{ categories: [{ label: "A", brick: { kind: "manual", allowNegative: false, max: -1 } }] },
		],
	])("refuse : %s", (_, patch) => {
		expect(parseGameExport(envelope({ ...validGame, ...patch })).ok).toBe(false);
	});
});
