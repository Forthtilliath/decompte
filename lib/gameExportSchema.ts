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

const label = (max: number) => z.string().trim().min(1).max(max);
const score = z.number().min(-MAX_SCORE).max(MAX_SCORE);

/** Types de calcul communs au partage et à la sauvegarde complète (lib/backupSchema) : mêmes règles
 * partout. Seul le multiplicateur diffère, qui désigne une autre catégorie (voir plus bas). */
const sharedBrickVariants = [
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
] as const;

/** Brique d'un jeu partagé. Le multiplicateur y désigne sa catégorie par position (à partir de 0),
 * les id ne voyageant pas ; clé ajoutée sans changer de version : une version antérieure de l'app
 * refuse ce jeu (type de calcul inconnu) plutôt que de le jouer faux. */
export const brickSchema = z.discriminatedUnion("kind", [
	...sharedBrickVariants,
	z.object({ kind: z.literal("product"), source: z.number().int().min(0).max(MAX_CATEGORIES) }),
]);

/** Brique d'un jeu enregistré (sauvegarde complète, stores) : le multiplicateur désigne sa
 * catégorie par id. */
export const storedBrickSchema = z.discriminatedUnion("kind", [
	...sharedBrickVariants,
	z.object({ kind: z.literal("product"), sourceId: z.string().min(1).max(64) }),
]);

export type ExportedBrick = z.infer<typeof brickSchema>;
export type StoredBrick = z.infer<typeof storedBrickSchema>;

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
					// Clé ajoutée sans changer de version : une version antérieure de l'app la
					// supprime à l'import et garde une catégorie sans critère, toujours jouable.
					requiresValidation: z.boolean().optional(),
				}),
			)
			.min(1)
			.max(MAX_CATEGORIES),
		// Options ajoutées sans changer de version : une version antérieure de l'app les supprime
		// à l'import et garde un jeu classé du plus haut au plus bas, chacun pour soi.
		lowestWins: z.boolean().optional(),
		teamPlay: z.boolean().optional(),
		/** Position (à partir de 0) de la catégorie qui départage : les id ne voyagent pas. */
		tieBreaker: z.number().int().min(0).max(MAX_CATEGORIES).optional(),
	})
	.refine((g) => g.maxPlayers >= g.minPlayers, { path: ["maxPlayers"] })
	.refine((g) => g.tieBreaker === undefined || g.tieBreaker < g.categories.length, {
		path: ["tieBreaker"],
	})
	// Un multiplicateur multiplie une catégorie placée avant lui (jamais lui-même, pas de boucle).
	.refine(
		(g) => g.categories.every((c, index) => c.brick.kind !== "product" || c.brick.source < index),
		{ path: ["categories"] },
	);

// `z.object` supprime les clés inconnues au lieu de les garder : rien d'inattendu n'entre en stockage.
export const exportSchema = z.object({
	format: z.literal(GAME_EXPORT_FORMAT),
	version: z.literal(GAME_EXPORT_VERSION),
	game: gameSchema,
});
