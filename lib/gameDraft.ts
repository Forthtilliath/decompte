import { AVATAR_PALETTE } from "@/lib/avatarColor";
import { paletteColor } from "@/lib/gameExport";
import {
	MAX_CATEGORIES,
	MAX_GAME_NAME_LENGTH,
	MAX_ITEMS,
	MAX_LABEL_LENGTH,
	MAX_PLAYERS,
	MAX_SCORE,
} from "@/lib/gameLimits";
import { createId } from "@/lib/uuid";
import type { CategoryDef, ScoringBrick } from "@/types/game";

/** Catégorie en cours d'édition : `id` absent tant qu'elle n'a jamais été enregistrée. */
export type DraftCategory = {
	id?: string;
	label: string;
	brick: ScoringBrick;
	/** Choisie dans le formulaire ; absente, la catégorie prend la couleur de sa position. */
	color?: string;
};

/** Saisie brute du formulaire de jeu (les bornes de joueurs sont encore du texte). */
export type GameDraftInput = {
	name: string;
	minPlayers: string;
	maxPlayers: string;
	categories: DraftCategory[];
};

export type GameDraftValues = {
	name: string;
	minPlayers: number;
	maxPlayers: number;
	categories: DraftCategory[];
};

export type GameDraftResult =
	| { ok: true; values: GameDraftValues }
	| { ok: false; title: string; message: string };

/** Brique par défaut quand on choisit un type de calcul. */
export function emptyBrick(kind: ScoringBrick["kind"]): ScoringBrick {
	switch (kind) {
		case "manual":
			return { kind: "manual", allowNegative: false };
		case "tokens":
			return { kind: "tokens", tokens: [] };
		case "choice":
			return { kind: "choice", options: [] };
		case "boolean":
			return { kind: "boolean", yesValue: 1, noValue: 0 };
	}
}

export function emptyCategory(): DraftCategory {
	return { label: "", brick: emptyBrick("manual") };
}

/** Couleur d'une nouvelle catégorie : la première de la palette pas encore prise par le jeu. */
export function nextCategoryColor(categories: DraftCategory[]): string {
	const used = new Set(categories.map((c, index) => c.color ?? paletteColor(index)));
	return AVATAR_PALETTE.find((color) => !used.has(color)) ?? paletteColor(categories.length);
}

const isBlank = (text: string) => !text.trim();
const isTooLong = (text: string) => text.trim().length > MAX_LABEL_LENGTH;
const isScoreOutOfRange = (value: number) => Math.abs(value) > MAX_SCORE;

function fail(title: string, message: string): GameDraftResult {
	return { ok: false, title, message };
}

/** Première anomalie d'une catégorie, ou `null` si elle est valide. */
function checkCategory({ label, brick }: DraftCategory): GameDraftResult | null {
	if (isBlank(label)) return fail("Catégorie incomplète", "Donne un nom à chaque catégorie.");
	if (isTooLong(label)) {
		return fail(
			"Nom trop long",
			`Un nom de catégorie fait ${MAX_LABEL_LENGTH} caractères maximum.`,
		);
	}

	switch (brick.kind) {
		case "manual":
			if (
				brick.max !== undefined &&
				(!Number.isInteger(brick.max) || brick.max < 0 || brick.max > MAX_SCORE)
			) {
				return fail("Plafond invalide", `Le plafond est un nombre entier entre 0 et ${MAX_SCORE}.`);
			}
			if (
				brick.unitValue !== undefined &&
				(!Number.isInteger(brick.unitValue) ||
					brick.unitValue === 0 ||
					isScoreOutOfRange(brick.unitValue))
			) {
				return fail(
					"Valeur par unité invalide",
					`Une unité vaut un nombre entier non nul entre −${MAX_SCORE} et ${MAX_SCORE}.`,
				);
			}
			return null;

		case "tokens":
			if (brick.tokens.length === 0) {
				return fail(
					"Jetons manquants",
					"Ajoute au moins un jeton aux catégories de type « Jetons ».",
				);
			}
			if (brick.tokens.length > MAX_ITEMS) {
				return fail("Trop de jetons", `Une catégorie compte ${MAX_ITEMS} jetons maximum.`);
			}
			if (brick.tokens.some((t) => isBlank(t.label))) {
				return fail("Jeton incomplet", "Donne un libellé à chaque jeton.");
			}
			if (brick.tokens.some((t) => isTooLong(t.label))) {
				return fail("Libellé trop long", `Un libellé fait ${MAX_LABEL_LENGTH} caractères maximum.`);
			}
			if (brick.tokens.some((t) => isScoreOutOfRange(t.value))) {
				return fail("Valeur invalide", `Un jeton vaut entre −${MAX_SCORE} et ${MAX_SCORE} points.`);
			}
			return null;

		case "choice": {
			if (brick.options.length < 2) {
				return fail(
					"Valeurs manquantes",
					"Ajoute au moins deux valeurs aux catégories de type « Choix ».",
				);
			}
			if (brick.options.length > MAX_ITEMS) {
				return fail("Trop de valeurs", `Une catégorie compte ${MAX_ITEMS} valeurs maximum.`);
			}
			if (brick.options.some((o) => isBlank(o.label))) {
				return fail(
					"Valeur incomplète",
					"Donne un libellé à chaque valeur d'une catégorie « Choix ».",
				);
			}
			if (brick.options.some((o) => isTooLong(o.label))) {
				return fail("Libellé trop long", `Un libellé fait ${MAX_LABEL_LENGTH} caractères maximum.`);
			}
			if (brick.options.some((o) => isScoreOutOfRange(o.value))) {
				return fail("Score invalide", `Un score est compris entre −${MAX_SCORE} et ${MAX_SCORE}.`);
			}
			// Seul le nombre de points est enregistré pour un joueur : deux valeurs au même score
			// seraient indiscernables, la seconde ne pourrait jamais apparaître cochée.
			const scores = brick.options.map((o) => o.value);
			if (new Set(scores).size !== scores.length) {
				return fail(
					"Scores en double",
					"Deux valeurs d'une catégorie « Choix » ne peuvent pas rapporter le même score.",
				);
			}
			return null;
		}

		case "boolean":
			if (isScoreOutOfRange(brick.yesValue) || isScoreOutOfRange(brick.noValue)) {
				return fail("Score invalide", `Un score est compris entre −${MAX_SCORE} et ${MAX_SCORE}.`);
			}
			// Même raison que pour « Choix » : Oui et Non au même score seraient indiscernables.
			if (brick.yesValue === brick.noValue) {
				return fail("Scores identiques", "Les scores « Oui » et « Non » doivent être différents.");
			}
			return null;
	}
}

/**
 * Vérifie le formulaire de jeu et en tire les valeurs à enregistrer. S'arrête à la première
 * anomalie, avec un titre et un message affichables tels quels.
 */
export function validateGameDraft(input: GameDraftInput): GameDraftResult {
	const name = input.name.trim();
	if (!name) return fail("Nom manquant", "Donne un nom au jeu.");
	if (name.length > MAX_GAME_NAME_LENGTH) {
		return fail("Nom trop long", `Le nom du jeu fait ${MAX_GAME_NAME_LENGTH} caractères maximum.`);
	}

	if (input.categories.length === 0) {
		return fail("Aucune catégorie", "Ajoute au moins une catégorie de score.");
	}
	if (input.categories.length > MAX_CATEGORIES) {
		return fail("Trop de catégories", `Un jeu compte ${MAX_CATEGORIES} catégories maximum.`);
	}
	for (const category of input.categories) {
		const error = checkCategory(category);
		if (error) return error;
	}

	// Champ vide ou nul : au moins 1 joueur ; maximum vide ou inférieur : égal au minimum.
	const minPlayers = Math.max(1, Number.parseInt(input.minPlayers, 10) || 1);
	const maxPlayers = Math.max(minPlayers, Number.parseInt(input.maxPlayers, 10) || minPlayers);
	if (maxPlayers > MAX_PLAYERS) {
		return fail("Trop de joueurs", `Un jeu se joue à ${MAX_PLAYERS} joueurs maximum.`);
	}

	return { ok: true, values: { name, minPlayers, maxPlayers, categories: input.categories } };
}

/**
 * Catégories définitives d'un jeu. Celles déjà enregistrées gardent leur id (voir CategoryDef) :
 * c'est ce qui garde l'historique résolvable après modification du jeu. Sans couleur choisie, la
 * couleur suit la position, comme à l'import d'un jeu partagé sans couleurs.
 */
export function toCategoryDefs(categories: DraftCategory[]): CategoryDef[] {
	return categories.map((c, index) => ({
		id: c.id ?? createId(),
		label: c.label.trim(),
		brick: c.brick,
		color: c.color ?? paletteColor(index),
	}));
}
