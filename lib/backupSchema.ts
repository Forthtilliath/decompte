import { z } from "zod";
import { relinkAvatarPhotos } from "@/lib/avatarPhotos";
import { brickSchema, importBrick } from "@/lib/gameExport";
import {
	MAX_CATEGORIES,
	MAX_GAME_NAME_LENGTH,
	MAX_LABEL_LENGTH,
	MAX_PLAYERS,
	MAX_ROUNDS,
	MAX_SCORE,
} from "@/lib/gameLimits";
import type { GameDef, Session } from "@/types/game";
import type { Player, PlayerGroup } from "@/types/player";

/**
 * Sauvegarde complète (fichier exporté ou copie Google Drive) : jeux, joueurs, groupes et
 * historique. La partie en cours et les réglages d'affichage, propres à l'appareil, n'en font pas
 * partie.
 */
export const BACKUP_APP_ID = "decompte";
// À incrémenter à tout changement incompatible du format, en gardant une migration depuis l'ancien.
export const BACKUP_DATA_VERSION = 1;

export type BackupData = {
	app: typeof BACKUP_APP_ID;
	dataVersion: number;
	exportedAt: number;
	games: GameDef[];
	players: Player[];
	groups: PlayerGroup[];
	sessions: Session[];
};

// Bornes larges par rapport à un usage réel, pour ne jamais refuser une sauvegarde légitime, mais
// assez serrées pour qu'un fichier modifié à la main ne fasse ni planter ni geler l'app.
export const MAX_ENTITIES = 1000;
export const MAX_SESSIONS = 100_000;
const MAX_NAME_LENGTH = 100;
/** Total d'une catégorie pour un joueur : des jetons nombreux peuvent dépasser MAX_SCORE. */
const MAX_SESSION_SCORE = MAX_SCORE * 1000;

export const idSchema = z.string().min(1).max(64);
/** Clé de score (lib/rounds) : id de catégorie, suivi de `#<manche>` après la première. */
const scoreKeySchema = z.string().regex(/^[^#]{1,64}(#\d{1,3})?$/);
export const timestampSchema = z.number().int().nonnegative();
const nameSchema = (max: number) => z.string().trim().min(1).max(max);
const colorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);

/** Objet indexé par id, au nombre d'entrées borné (`z.record` seul n'en limite pas le nombre). */
function boundedRecord<T extends z.ZodType>(value: T, maxEntries: number) {
	return z
		.record(idSchema, value)
		.refine((record) => Object.keys(record).length <= maxEntries, { message: "trop d'entrées" });
}

export const gameSchema = z
	.object({
		id: idSchema,
		name: nameSchema(MAX_GAME_NAME_LENGTH),
		categories: z
			.array(
				z.object({
					id: idSchema,
					label: nameSchema(MAX_LABEL_LENGTH),
					color: colorSchema,
					brick: brickSchema,
					requiresValidation: z.boolean().optional(),
				}),
			)
			.min(1)
			.max(MAX_CATEGORIES),
		minPlayers: z.number().int().min(1).max(MAX_PLAYERS),
		maxPlayers: z.number().int().min(1).max(MAX_PLAYERS),
		rounds: z.number().int().min(1).max(MAX_ROUNDS).optional(),
		createdAt: timestampSchema,
		isArchived: z.boolean(),
	})
	.refine((g) => g.maxPlayers >= g.minPlayers, { path: ["maxPlayers"] });

// `avatarUri` n'est jamais chargée telle quelle (adresse web, fichier d'un autre téléphone) : elle
// sert seulement à retrouver, par son nom, une photo encore présente dans le dossier des avatars de
// l'app (restauration sur le même téléphone, annulation d'une restauration). Voir parseBackup.
export const playerSchema = z.object({
	id: idSchema,
	name: nameSchema(MAX_NAME_LENGTH),
	avatarUri: z.string().max(1024).optional(),
	isFavorite: z.boolean(),
	isArchived: z.boolean(),
	createdAt: timestampSchema,
});

export const groupSchema = z.object({
	id: idSchema,
	name: nameSchema(MAX_NAME_LENGTH),
	playerIds: z.array(idSchema).max(MAX_ENTITIES),
	isFavorite: z.boolean(),
	isArchived: z.boolean(),
	createdAt: timestampSchema,
});

/** Scores d'une partie par joueur : partie terminée ou partie en cours (stores/sessionStore). */
export const sessionEntriesSchema = boundedRecord(
	z.object({
		playerId: idSchema,
		// Une clé par catégorie et par manche (lib/rounds : `scoreKey`).
		scores: boundedRecord(
			z.number().min(-MAX_SESSION_SCORE).max(MAX_SESSION_SCORE),
			MAX_CATEGORIES * MAX_ROUNDS,
		),
		// Clés de score dont le critère est validé (catégories à critère seulement).
		validated: z
			.array(scoreKeySchema)
			.max(MAX_CATEGORIES * MAX_ROUNDS)
			.optional(),
	}),
	MAX_PLAYERS,
);

export const sessionSchema = z.object({
	id: idSchema,
	gameDefId: idSchema,
	createdAt: timestampSchema,
	finishedAt: timestampSchema.optional(),
	playerIds: z.array(idSchema).max(MAX_PLAYERS),
	entries: sessionEntriesSchema,
});

function uniqueIds(items: { id: string }[]): boolean {
	return new Set(items.map((item) => item.id)).size === items.length;
}

// `z.object` supprime les clés inconnues : rien d'inattendu n'entre en stockage.
const backupSchema = z
	.object({
		app: z.literal(BACKUP_APP_ID),
		dataVersion: z.literal(BACKUP_DATA_VERSION),
		exportedAt: timestampSchema,
		games: z.array(gameSchema).max(MAX_ENTITIES),
		players: z.array(playerSchema).max(MAX_ENTITIES),
		groups: z.array(groupSchema).max(MAX_ENTITIES),
		sessions: z.array(sessionSchema).max(MAX_SESSIONS),
	})
	.superRefine((data, ctx) => {
		for (const key of ["games", "players", "groups", "sessions"] as const) {
			if (!uniqueIds(data[key])) {
				ctx.addIssue({ code: "custom", path: [key], message: "identifiants en double" });
			}
		}
	});

/**
 * Lit le contenu d'une sauvegarde (fichier importé ou copie Google Drive, déjà déchiffrée). Le
 * fichier entier est rejeté à la première anomalie, rien n'est appliqué à moitié : l'erreur levée
 * porte un message affichable tel quel.
 */
export function parseBackup(text: string): BackupData {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		throw new Error("Ce fichier n'est pas une sauvegarde Décompte (format illisible).");
	}

	const header = raw as { app?: unknown; dataVersion?: unknown } | null;
	if (typeof header !== "object" || header === null || header.app !== BACKUP_APP_ID) {
		throw new Error("Ce fichier n'est pas une sauvegarde Décompte.");
	}
	if (typeof header.dataVersion === "number" && header.dataVersion > BACKUP_DATA_VERSION) {
		throw new Error(
			"Cette sauvegarde vient d'une version plus récente de Décompte. Mets l'app à jour avant de la restaurer.",
		);
	}

	const parsed = backupSchema.safeParse(raw);
	if (!parsed.success) {
		const where = parsed.error.issues[0].path.join(" › ") || "contenu";
		throw new Error(`Sauvegarde corrompue ou modifiée : champ « ${where} » incorrect.`);
	}

	const data = parsed.data;
	return {
		...data,
		// Les options "choice" ont un id local (clé de liste dans l'éditeur), jamais référencé par
		// les parties : il est régénéré, comme à l'import d'un jeu partagé.
		games: data.games.map((game) => ({
			...game,
			categories: game.categories.map((c) => ({ ...c, brick: importBrick(c.brick) })),
		})),
		players: relinkAvatarPhotos(data.players),
	};
}
