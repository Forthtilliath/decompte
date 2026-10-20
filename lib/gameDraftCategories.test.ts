import { AVATAR_PALETTE } from "@/lib/avatarColor";
import {
	type DraftCategory,
	emptyBrick,
	type GameDraftInput,
	nextCategoryColor,
	toCategoryDefs,
	validateGameDraft,
} from "@/lib/gameDraft";
import { paletteColor } from "@/lib/gameExport";

const manual = (label = "Points", id?: string): DraftCategory => ({
	...(id && { id }),
	label,
	brick: emptyBrick("manual"),
});

function draft(overrides: Partial<GameDraftInput> = {}): GameDraftInput {
	return {
		name: "Azul",
		minPlayers: "2",
		maxPlayers: "4",
		rounds: "1",
		categories: [manual("Murs", "murs"), manual("Bonus", "bonus")],
		lowestWins: false,
		teamPlay: false,
		...overrides,
	};
}

describe("validateGameDraft : options du jeu", () => {
	it("garde le plus bas gagne, le départage et les équipes", () => {
		const result = validateGameDraft(
			draft({ lowestWins: true, tieBreakerId: "bonus", teamPlay: true }),
		);
		if (!result.ok) throw new Error(result.message);
		expect(result.values).toMatchObject({
			lowestWins: true,
			tieBreakerId: "bonus",
			teamPlay: true,
		});
	});

	it("retire un départage sur une catégorie supprimée entre-temps", () => {
		const result = validateGameDraft(draft({ tieBreakerId: "disparue" }));
		if (!result.ok) throw new Error(result.message);
		expect(result.values.tieBreakerId).toBeUndefined();
	});
});

describe("validateGameDraft : multiplicateur", () => {
	const product = (sourceId: string, id = "x"): DraftCategory => ({
		id,
		label: "Bonus",
		brick: { kind: "product", sourceId },
	});
	const outcome = (categories: DraftCategory[]) => {
		const result = validateGameDraft(draft({ categories }));
		return result.ok ? "ok" : result.title;
	};

	it("accepte une catégorie placée au-dessus", () => {
		expect(outcome([manual("Sets", "sets"), product("sets")])).toBe("ok");
	});

	it("refuse sans catégorie choisie, placée en dessous ou elle-même", () => {
		expect(outcome([manual("Sets", "sets"), product("")])).toBe("Catégorie multipliée manquante");
		expect(outcome([product("sets"), manual("Sets", "sets")])).toBe(
			"Catégorie multipliée manquante",
		);
		expect(outcome([manual("Sets", "sets"), product("x", "x")])).toBe(
			"Catégorie multipliée manquante",
		);
	});
});

describe("nextCategoryColor", () => {
	it("prend la première couleur de la palette pas encore utilisée", () => {
		expect(nextCategoryColor([])).toBe(AVATAR_PALETTE[0]);
		// La première catégorie, sans couleur choisie, occupe celle de sa position.
		const taken = [manual(), { ...manual(), color: AVATAR_PALETTE[1] }];
		expect(nextCategoryColor(taken)).toBe(AVATAR_PALETTE[2]);
		expect(nextCategoryColor([{ ...manual(), color: AVATAR_PALETTE[1] }])).toBe(AVATAR_PALETTE[0]);
	});

	it("reprend la palette quand toutes les couleurs sont prises", () => {
		const all = AVATAR_PALETTE.map((color) => ({ ...manual(), color }));
		expect(nextCategoryColor(all)).toBe(paletteColor(AVATAR_PALETTE.length));
	});
});

describe("toCategoryDefs", () => {
	it("garde l'id des catégories existantes et en crée pour les nouvelles", () => {
		const defs = toCategoryDefs([manual("Murs", "existante"), manual("Bonus")]);
		expect(defs[0].id).toBe("existante");
		expect(defs[1].id).toEqual(expect.any(String));
		expect(defs[1].id).not.toBe("existante");
	});

	it("garde la couleur choisie", () => {
		const defs = toCategoryDefs([{ ...manual("Murs"), color: "#3b82f6" }, manual("Bonus")]);
		expect(defs.map((d) => d.color)).toEqual(["#3b82f6", paletteColor(1)]);
	});

	it("garde le critère à valider, sans l'écrire sur les autres catégories", () => {
		const defs = toCategoryDefs([
			{ ...manual("Murs"), requiresValidation: true },
			{ ...manual("Bonus"), requiresValidation: false },
			manual("Lignes"),
		]);
		expect(defs[0].requiresValidation).toBe(true);
		expect(defs[1]).not.toHaveProperty("requiresValidation");
		expect(defs[2]).not.toHaveProperty("requiresValidation");
	});

	it("colore par position comme l'import et nettoie les libellés", () => {
		const defs = toCategoryDefs([manual(" Murs "), manual("Bonus")]);
		expect(defs.map((d) => [d.label, d.color])).toEqual([
			["Murs", paletteColor(0)],
			["Bonus", paletteColor(1)],
		]);
	});
});
