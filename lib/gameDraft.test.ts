import {
	type DraftCategory,
	emptyBrick,
	emptyCategory,
	type GameDraftInput,
	validateGameDraft,
} from "@/lib/gameDraft";
import type { ScoringBrick } from "@/types/game";

const manual = (label = "Points"): DraftCategory => ({ label, brick: emptyBrick("manual") });
const withBrick = (brick: ScoringBrick, label = "Catégorie"): DraftCategory => ({ label, brick });
const option = (label: string, value: number) => ({ id: label, label, value });

function draft(overrides: Partial<GameDraftInput> = {}): GameDraftInput {
	return {
		name: "Azul",
		minPlayers: "2",
		maxPlayers: "4",
		roundMode: "fixed",
		rounds: "1",
		scoreLimit: "",
		categories: [manual()],
		lowestWins: false,
		teamPlay: false,
		...overrides,
	};
}

/** Titre de l'erreur renvoyée, ou "ok". */
function outcome(input: GameDraftInput): string {
	const result = validateGameDraft(input);
	return result.ok ? "ok" : result.title;
}

describe("emptyBrick", () => {
	it("donne une brique valide par défaut pour chaque type", () => {
		expect(emptyBrick("manual")).toEqual({ kind: "manual", allowNegative: false });
		expect(emptyBrick("tokens")).toEqual({ kind: "tokens", tokens: [] });
		expect(emptyBrick("choice")).toEqual({ kind: "choice", options: [] });
		expect(emptyBrick("boolean")).toEqual({ kind: "boolean", yesValue: 1, noValue: 0 });
	});

	it("crée une catégorie vide de type nombre", () => {
		expect(emptyCategory()).toEqual({
			id: expect.any(String),
			label: "",
			brick: { kind: "manual", allowNegative: false },
		});
	});
});

describe("validateGameDraft", () => {
	it("accepte un jeu complet et nettoie le nom", () => {
		expect(validateGameDraft(draft({ name: "  Azul  " }))).toEqual({
			ok: true,
			values: {
				name: "Azul",
				minPlayers: 2,
				maxPlayers: 4,
				rounds: 1,
				categories: [manual()],
				lowestWins: false,
				tieBreakerId: undefined,
				teamPlay: false,
			},
		});
	});

	it("renvoie un message affichable", () => {
		expect(validateGameDraft(draft({ name: " " }))).toEqual({
			ok: false,
			title: "Nom manquant",
			message: "Donne un nom au jeu.",
		});
	});

	describe("nom et catégories", () => {
		it.each([
			["nom trop long", draft({ name: "x".repeat(61) }), "Nom trop long"],
			["aucune catégorie", draft({ categories: [] }), "Aucune catégorie"],
			[
				"trop de catégories",
				draft({ categories: Array.from({ length: 31 }, () => manual()) }),
				"Trop de catégories",
			],
			["catégorie sans nom", draft({ categories: [manual("  ")] }), "Catégorie incomplète"],
			[
				"nom de catégorie trop long",
				draft({ categories: [manual("x".repeat(41))] }),
				"Nom trop long",
			],
		])("refuse : %s", (_, input, title) => {
			expect(outcome(input)).toBe(title);
		});

		it("accepte les longueurs maximales", () => {
			expect(outcome(draft({ name: "x".repeat(60), categories: [manual("y".repeat(40))] }))).toBe(
				"ok",
			);
		});
	});

	describe("bornes de joueurs", () => {
		const players = (minPlayers: string, maxPlayers: string) => {
			const result = validateGameDraft(draft({ minPlayers, maxPlayers }));
			return result.ok ? [result.values.minPlayers, result.values.maxPlayers] : result.title;
		};

		it("lit les bornes saisies", () => {
			expect(players("3", "5")).toEqual([3, 5]);
		});

		it("met au moins 1 joueur si le minimum est vide, nul ou négatif (texte collé)", () => {
			expect(players("", "4")).toEqual([1, 4]);
			expect(players("0", "4")).toEqual([1, 4]);
			expect(players("-3", "4")).toEqual([1, 4]);
		});

		it("aligne le maximum sur le minimum s'il est vide ou plus petit", () => {
			expect(players("3", "")).toEqual([3, 3]);
			expect(players("5", "2")).toEqual([5, 5]);
		});

		it("refuse plus de 50 joueurs (limite de l'import)", () => {
			expect(players("2", "50")).toEqual([2, 50]);
			expect(players("2", "51")).toBe("Trop de joueurs");
			expect(players("60", "")).toBe("Trop de joueurs");
		});
	});

	describe("manches", () => {
		const rounds = (value: string) => {
			const result = validateGameDraft(draft({ rounds: value }));
			return result.ok ? result.values.rounds : result.title;
		};

		it("lit le nombre de manches saisi", () => {
			expect(rounds("3")).toBe(3);
		});

		it("met une seule manche si le champ est vide, nul ou négatif", () => {
			expect(rounds("")).toBe(1);
			expect(rounds("0")).toBe(1);
			expect(rounds("-2")).toBe(1);
		});

		it("refuse plus de 20 manches (limite de l'import)", () => {
			expect(rounds("20")).toBe(20);
			expect(rounds("21")).toBe("Trop de manches");
		});
	});

	describe("manches ouvertes", () => {
		const openRounds = (overrides: Partial<GameDraftInput>) => {
			const result = validateGameDraft(draft(overrides));
			return result.ok ? result.values : result.title;
		};

		it("enregistre le seuil de fin de partie, sans nombre de manches", () => {
			expect(
				openRounds({ roundMode: "scoreLimit", scoreLimit: " 15 ", rounds: "4" }),
			).toMatchObject({ rounds: 1, openRounds: { scoreLimit: 15 } });
		});

		it("refuse un seuil vide, nul, décimal ou trop grand", () => {
			for (const scoreLimit of ["", "0", "-5", "12.5", "abc", "10001"]) {
				expect(openRounds({ roundMode: "scoreLimit", scoreLimit })).toBe("Seuil invalide");
			}
			expect(openRounds({ roundMode: "scoreLimit", scoreLimit: "10000" })).toMatchObject({
				openRounds: { scoreLimit: 10_000 },
			});
		});

		it("enregistre des manches libres, sans seuil", () => {
			expect(openRounds({ roundMode: "free", scoreLimit: "15" })).toMatchObject({
				rounds: 1,
				openRounds: {},
			});
		});

		it("n'écrit rien de plus pour un nombre fixe de manches", () => {
			const values = openRounds({ roundMode: "fixed", scoreLimit: "15" });
			expect(values).not.toHaveProperty("openRounds");
		});
	});

	describe("catégorie « Nombre »", () => {
		const capped = (max: number) =>
			outcome(draft({ categories: [withBrick({ kind: "manual", allowNegative: false, max })] }));

		it("accepte un plafond entier entre 0 et 10 000", () => {
			expect(capped(0)).toBe("ok");
			expect(capped(10_000)).toBe("ok");
		});

		it("refuse un plafond hors bornes ou décimal", () => {
			expect(capped(-1)).toBe("Plafond invalide");
			expect(capped(10_001)).toBe("Plafond invalide");
			expect(capped(2.5)).toBe("Plafond invalide");
		});

		const perUnit = (unitValue: number) =>
			outcome(
				draft({ categories: [withBrick({ kind: "manual", allowNegative: false, unitValue })] }),
			);

		it("accepte une valeur par unité entière, négative comprise", () => {
			expect(perUnit(-4)).toBe("ok");
			expect(perUnit(10_000)).toBe("ok");
		});

		it("refuse une valeur par unité nulle, décimale ou hors bornes", () => {
			expect(perUnit(0)).toBe("Valeur par unité invalide");
			expect(perUnit(1.5)).toBe("Valeur par unité invalide");
			expect(perUnit(-10_001)).toBe("Valeur par unité invalide");
		});
	});

	describe("catégorie « Jetons »", () => {
		const tokens = (list: { label: string; value: number }[]) =>
			outcome(draft({ categories: [withBrick({ kind: "tokens", tokens: list })] }));

		it("accepte des jetons positifs et négatifs", () => {
			expect(
				tokens([
					{ label: "Victoire", value: 3 },
					{ label: "Défaite", value: -1 },
				]),
			).toBe("ok");
		});

		it.each([
			["sans jeton", [], "Jetons manquants"],
			[
				"trop de jetons",
				Array.from({ length: 31 }, (_, i) => ({ label: `J${i}`, value: 1 })),
				"Trop de jetons",
			],
			["jeton sans libellé", [{ label: " ", value: 1 }], "Jeton incomplet"],
			["libellé trop long", [{ label: "x".repeat(41), value: 1 }], "Libellé trop long"],
			["valeur trop grande", [{ label: "J", value: 10_001 }], "Valeur invalide"],
			["valeur trop petite", [{ label: "J", value: -10_001 }], "Valeur invalide"],
		])("refuse : %s", (_, list, title) => {
			expect(tokens(list)).toBe(title);
		});
	});

	describe("catégorie « Choix »", () => {
		const choice = (options: ReturnType<typeof option>[]) =>
			outcome(draft({ categories: [withBrick({ kind: "choice", options })] }));

		it("accepte au moins deux valeurs aux scores distincts", () => {
			expect(choice([option("Palier 1", 2), option("Palier 2", 5)])).toBe("ok");
		});

		it.each([
			["une seule valeur", [option("A", 1)], "Valeurs manquantes"],
			[
				"trop de valeurs",
				Array.from({ length: 31 }, (_, i) => option(`V${i}`, i)),
				"Trop de valeurs",
			],
			["valeur sans libellé", [option("A", 1), option("", 2)], "Valeur incomplète"],
			["libellé trop long", [option("A", 1), option("x".repeat(41), 2)], "Libellé trop long"],
			["score hors bornes", [option("A", 1), option("B", 99_999)], "Score invalide"],
			["deux valeurs au même score", [option("A", 3), option("B", 3)], "Scores en double"],
		])("refuse : %s", (_, options, title) => {
			expect(choice(options)).toBe(title);
		});
	});

	describe("catégorie « Oui / Non »", () => {
		const yesNo = (yesValue: number, noValue: number) =>
			outcome(draft({ categories: [withBrick({ kind: "boolean", yesValue, noValue })] }));

		it("accepte deux scores différents, négatifs compris", () => {
			expect(yesNo(5, -2)).toBe("ok");
		});

		it("refuse deux scores identiques (Non ne pourrait jamais être coché)", () => {
			expect(yesNo(0, 0)).toBe("Scores identiques");
		});

		it("refuse un score hors bornes", () => {
			expect(yesNo(20_000, 0)).toBe("Score invalide");
		});
	});

	it("signale la première catégorie fautive dans l'ordre", () => {
		const categories = [manual("OK"), manual(""), withBrick({ kind: "tokens", tokens: [] })];
		expect(outcome(draft({ categories }))).toBe("Catégorie incomplète");
	});
});
