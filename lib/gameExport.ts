import { z } from "zod";
import { AVATAR_PALETTE } from "@/lib/avatarColor";
import {
	MAX_CATEGORIES,
	MAX_GAME_NAME_LENGTH,
	MAX_ITEMS,
	MAX_LABEL_LENGTH,
	MAX_PLAYERS,
	MAX_ROUNDS,
	MAX_SCORE,
} from "@/lib/gameLimits";
import { createId } from "@/lib/uuid";
import type { GameDef, ScoringBrick } from "@/types/game";

/**
 * Format d'échange d'un jeu entre joueurs (partage par message, plus tard via la plateforme).
 * Seule la définition du jeu voyage : ni id, ni date, ni état d'archivage. Tout ça est recréé
 * localement à l'import, pour ne jamais faire confiance à un texte venu d'ailleurs. La couleur
 * des catégories voyage, mais seulement si elle fait partie de la palette (lisible sous du texte
 * blanc) ; absente, elle suit la position. Champ optionnel : les versions qui ne le connaissent
 * pas l'ignorent, d'où pas de changement de version du format.
 */
export const GAME_EXPORT_FORMAT = "decompte-game";
// À incrémenter à tout changement incompatible du format (et garder la lecture de l'ancien).
export const GAME_EXPORT_VERSION = 1;

/** Au-delà, on refuse avant même de lire le JSON : un vrai jeu pèse quelques Ko. */
export const MAX_EXPORT_LENGTH = 50_000;

const label = (max: number) => z.string().trim().min(1).max(max);
const score = z.number().min(-MAX_SCORE).max(MAX_SCORE);

/** Aussi appliqué aux jeux d'une sauvegarde complète (lib/backupSchema) : mêmes règles partout. */
export const brickSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("manual"),
		allowNegative: z.boolean(),
		max: z.number().int().min(0).max(MAX_SCORE).optional(),
		// Clé ajoutée sans changer de version : une version antérieure de l'app la supprime à
		// l'import et garde une catégorie « Nombre » ordinaire, toujours jouable.
		unitValue: score
			.int()
			.refine((v) => v !== 0)
			.optional(),
	}),
	z.object({
		kind: z.literal("tokens"),
		tokens: z
			.array(z.object({ label: label(MAX_LABEL_LENGTH), value: score }))
			.min(1)
			.max(MAX_ITEMS),
	}),
	z.object({
		kind: z.literal("choice"),
		options: z
			.array(z.object({ label: label(MAX_LABEL_LENGTH), value: score }))
			.min(2)
			.max(MAX_ITEMS)
			// Mêmes règles que le formulaire (lib/gameDraft) : seul le score d'un joueur est
			// enregistré, deux réponses au même score seraient indiscernables.
			.refine((options) => new Set(options.map((o) => o.value)).size === options.length),
	}),
	z
		.object({ kind: z.literal("boolean"), yesValue: score, noValue: score })
		.refine((b) => b.yesValue !== b.noValue, { path: ["noValue"] }),
]);

const gameSchema = z
	.object({
		name: label(MAX_GAME_NAME_LENGTH),
		minPlayers: z.number().int().min(1).max(MAX_PLAYERS),
		maxPlayers: z.number().int().min(1).max(MAX_PLAYERS),
		// Clé ajoutée sans changer de version, comme `unitValue` : une version antérieure de l'app
		// la supprime à l'import et garde un jeu en une seule manche.
		rounds: z.number().int().min(1).max(MAX_ROUNDS).optional(),
		categories: z
			.array(
				z.object({
					label: label(MAX_LABEL_LENGTH),
					color: z.enum(AVATAR_PALETTE).optional(),
					brick: brickSchema,
				}),
			)
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
	rounds: number;
	categories: { label: string; color: string; brick: ScoringBrick }[];
};

export type ImportResult = { ok: true; game: ImportedGame } | { ok: false; error: string };

function exportBrick(brick: ScoringBrick): ExportedBrick {
	switch (brick.kind) {
		case "manual":
			return {
				kind: "manual",
				allowNegative: brick.allowNegative,
				...(brick.max !== undefined && { max: brick.max }),
				...(brick.unitValue !== undefined && { unitValue: brick.unitValue }),
			};
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
			...(game.rounds !== undefined && game.rounds > 1 && { rounds: game.rounds }),
			categories: game.categories.map((c) => ({
				label: c.label,
				// Une couleur hors palette (possible via une sauvegarde) serait refusée à l'import.
				...(isPaletteColor(c.color) && { color: c.color }),
				brick: exportBrick(c.brick),
			})),
		},
	});
}

/** Couleur par défaut d'une catégorie selon sa position, quand aucune n'a été choisie. */
export function paletteColor(index: number): string {
	return AVATAR_PALETTE[index % AVATAR_PALETTE.length];
}

function isPaletteColor(color: string): boolean {
	return (AVATAR_PALETTE as readonly string[]).includes(color);
}

export function importBrick(brick: ExportedBrick): ScoringBrick {
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
	rounds: "manches",
	categories: "catégories",
	label: "libellé",
	brick: "mode de calcul",
	kind: "mode de calcul",
	allowNegative: "valeurs négatives",
	max: "valeur maximum",
	unitValue: "points par unité",
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
			rounds: game.rounds ?? 1,
			categories: game.categories.map((c, index) => ({
				label: c.label,
				color: c.color ?? paletteColor(index),
				brick: importBrick(c.brick),
			})),
		},
	};
}
