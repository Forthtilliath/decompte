import { z } from "zod";
import { AVATAR_PALETTE } from "@/lib/avatarColor";
import { createId } from "@/lib/uuid";
import type { GameDef, ScoringBrick } from "@/types/game";

/**
 * Format d'échange d'un jeu entre joueurs (partage par message, plus tard via la plateforme).
 * Seule la définition du jeu voyage : ni id, ni date, ni état d'archivage, ni couleur. Tout ça
 * est recréé localement à l'import, pour ne jamais faire confiance à un texte venu d'ailleurs.
 */
export const GAME_EXPORT_FORMAT = "decompte-game";
// À incrémenter à tout changement incompatible du format (et garder la lecture de l'ancien).
export const GAME_EXPORT_VERSION = 1;

/** Au-delà, on refuse avant même de lire le JSON : un vrai jeu pèse quelques Ko. */
export const MAX_EXPORT_LENGTH = 50_000;

const MAX_CATEGORIES = 30;
const MAX_ITEMS = 30;
const MAX_SCORE = 10_000;
const MAX_PLAYERS = 50;

const label = (max: number) => z.string().trim().min(1).max(max);
const score = z.number().min(-MAX_SCORE).max(MAX_SCORE);

const brickSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("manual"),
		allowNegative: z.boolean(),
		max: z.number().int().min(0).max(MAX_SCORE).optional(),
	}),
	z.object({
		kind: z.literal("tokens"),
		tokens: z
			.array(z.object({ label: label(40), value: score }))
			.min(1)
			.max(MAX_ITEMS),
	}),
	z.object({
		kind: z.literal("choice"),
		options: z
			.array(z.object({ label: label(40), value: score }))
			.min(2)
			.max(MAX_ITEMS),
	}),
	z.object({ kind: z.literal("boolean"), yesValue: score, noValue: score }),
]);

const gameSchema = z
	.object({
		name: label(60),
		minPlayers: z.number().int().min(1).max(MAX_PLAYERS),
		maxPlayers: z.number().int().min(1).max(MAX_PLAYERS),
		categories: z
			.array(z.object({ label: label(40), brick: brickSchema }))
			.min(1)
			.max(MAX_CATEGORIES),
	})
	.refine((g) => g.maxPlayers >= g.minPlayers, { path: ["maxPlayers"] });

// `z.object` supprime les clés inconnues au lieu de les garder : rien d'inattendu n'entre en stockage.
const exportSchema = z.object({
	format: z.literal(GAME_EXPORT_FORMAT),
	version: z.literal(GAME_EXPORT_VERSION),
	game: gameSchema,
});

type ExportedBrick = z.infer<typeof brickSchema>;

/** Données prêtes pour `gamesStore.addGame` (qui attribue les id des catégories). */
export type ImportedGame = {
	name: string;
	minPlayers: number;
	maxPlayers: number;
	categories: { label: string; color: string; brick: ScoringBrick }[];
};

export type ImportResult = { ok: true; game: ImportedGame } | { ok: false; error: string };

function exportBrick(brick: ScoringBrick): ExportedBrick {
	switch (brick.kind) {
		case "manual":
			return brick.max === undefined
				? { kind: "manual", allowNegative: brick.allowNegative }
				: { kind: "manual", allowNegative: brick.allowNegative, max: brick.max };
		case "tokens":
			return {
				kind: "tokens",
				tokens: brick.tokens.map((t) => ({ label: t.label, value: t.value })),
			};
		case "choice":
			return {
				kind: "choice",
				options: brick.options.map((o) => ({ label: o.label, value: o.value })),
			};
		case "boolean":
			return { kind: "boolean", yesValue: brick.yesValue, noValue: brick.noValue };
	}
}

export function serializeGame(game: GameDef): string {
	return JSON.stringify({
		format: GAME_EXPORT_FORMAT,
		version: GAME_EXPORT_VERSION,
		game: {
			name: game.name,
			minPlayers: game.minPlayers,
			maxPlayers: game.maxPlayers,
			categories: game.categories.map((c) => ({ label: c.label, brick: exportBrick(c.brick) })),
		},
	});
}

/** Couleur par position, comme à la création d'un jeu (pas de sélecteur de couleur en V1). */
export function paletteColor(index: number): string {
	return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}

function importBrick(brick: ExportedBrick): ScoringBrick {
	if (brick.kind !== "choice") return brick;
	// Les options "choice" ont un id local (clé de liste dans l'éditeur) : toujours régénéré.
	return { kind: "choice", options: brick.options.map((o) => ({ ...o, id: createId() })) };
}

const FIELD_NAMES: Record<string, string> = {
	format: "format",
	version: "version",
	name: "nom du jeu",
	minPlayers: "joueurs min.",
	maxPlayers: "joueurs max.",
	categories: "catégories",
	label: "libellé",
	brick: "mode de calcul",
	kind: "mode de calcul",
	allowNegative: "valeurs négatives",
	max: "valeur maximum",
	tokens: "jetons",
	options: "valeurs",
	value: "valeur",
	yesValue: "score si Oui",
	noValue: "score si Non",
};

/** Chemin zod (`game.categories.1.label`) lisible : « catégories n° 2 › libellé ». */
function describePath(path: PropertyKey[]): string {
	const parts = path
		.filter((key) => key !== "game")
		.map((key) =>
			typeof key === "number" ? `n° ${key + 1}` : (FIELD_NAMES[String(key)] ?? String(key)),
		);
	return parts.join(" › ").replace(/ › n° /g, " n° ");
}

/**
 * Lit un jeu partagé. Tout le texte est rejeté à la première anomalie : rien n'est importé à
 * moitié. Le message d'erreur est affichable tel quel.
 */
export function parseGameExport(text: string): ImportResult {
	const trimmed = text.trim();
	if (trimmed.length === 0) return { ok: false, error: "Colle d'abord le texte du jeu partagé." };
	if (trimmed.length > MAX_EXPORT_LENGTH) {
		return { ok: false, error: "Ce texte est trop long pour être un jeu Décompte." };
	}

	let raw: unknown;
	try {
		raw = JSON.parse(trimmed);
	} catch {
		return { ok: false, error: "Ce texte n'est pas un jeu Décompte (format illisible)." };
	}

	const parsed = exportSchema.safeParse(raw);
	if (!parsed.success) {
		const issue = parsed.error.issues[0];
		const where = describePath(issue.path);
		if (where === "format" || where === "") {
			return { ok: false, error: "Ce texte n'est pas un jeu Décompte." };
		}
		const version = (raw as { version?: unknown }).version;
		if (where === "version" && typeof version === "number" && version > GAME_EXPORT_VERSION) {
			return {
				ok: false,
				error: "Ce jeu vient d'une version de Décompte plus récente. Mets l'app à jour.",
			};
		}
		return { ok: false, error: `Jeu invalide : ${where} incorrect.` };
	}

	const { game } = parsed.data;
	return {
		ok: true,
		game: {
			name: game.name,
			minPlayers: game.minPlayers,
			maxPlayers: game.maxPlayers,
			categories: game.categories.map((c, index) => ({
				label: c.label,
				color: paletteColor(index),
				brick: importBrick(c.brick),
			})),
		},
	};
}
