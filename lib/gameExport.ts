import { AVATAR_PALETTE } from "@/lib/avatarColor";
import {
	type ExportedBrick,
	exportSchema,
	GAME_EXPORT_FORMAT,
	GAME_EXPORT_VERSION,
	type StoredBrick,
} from "@/lib/gameExportSchema";
import { createId } from "@/lib/uuid";
import type { GameDef, ScoringBrick } from "@/types/game";

export { brickSchema, GAME_EXPORT_FORMAT, GAME_EXPORT_VERSION } from "@/lib/gameExportSchema";

/** Au-delà, on refuse avant même de lire le JSON : un vrai jeu pèse quelques Ko. */
export const MAX_EXPORT_LENGTH = 50_000;

/** Données prêtes pour `gamesStore.addGame`. */
export type ImportedGame = Pick<
	GameDef,
	| "name"
	| "minPlayers"
	| "maxPlayers"
	| "categories"
	| "lowestWins"
	| "tieBreakerId"
	| "teamPlay"
	| "openRounds"
> & { rounds: number };

export type ImportResult = { ok: true; game: ImportedGame } | { ok: false; error: string };

/** `positionOf` : position d'une catégorie du jeu d'après son id (le multiplicateur la désigne). */
function exportBrick(brick: ScoringBrick, positionOf: (id: string) => number): ExportedBrick {
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
		case "product":
			return { kind: "product", source: positionOf(brick.sourceId) };
	}
}

export function serializeGame(game: GameDef): string {
	const positionOf = (id: string) => game.categories.findIndex((c) => c.id === id);
	const tieBreaker = game.tieBreakerId ? positionOf(game.tieBreakerId) : -1;
	return JSON.stringify({
		format: GAME_EXPORT_FORMAT,
		version: GAME_EXPORT_VERSION,
		game: {
			name: game.name,
			minPlayers: game.minPlayers,
			maxPlayers: game.maxPlayers,
			...(game.rounds !== undefined && game.rounds > 1 && { rounds: game.rounds }),
			...(game.openRounds && { openRounds: game.openRounds }),
			categories: game.categories.map((c) => ({
				label: c.label,
				// Une couleur hors palette (possible via une sauvegarde) serait refusée à l'import.
				...(isPaletteColor(c.color) && { color: c.color }),
				brick: exportBrick(c.brick, positionOf),
				...(c.requiresValidation && { requiresValidation: true }),
			})),
			...(game.lowestWins && { lowestWins: true }),
			...(game.teamPlay && { teamPlay: true }),
			...(tieBreaker >= 0 && { tieBreaker }),
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

export function importBrick(brick: StoredBrick): ScoringBrick {
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
	openRounds: "manches ouvertes",
	scoreLimit: "seuil de fin de partie",
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
	requiresValidation: "critère à valider",
	lowestWins: "le plus bas gagne",
	teamPlay: "jeu en équipes",
	tieBreaker: "départage",
	source: "catégorie multipliée",
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

/** Lit un modèle prêt à l'emploi (constants/gameTemplates) comme un jeu partagé. */
export function parseGameTemplate(game: Record<string, unknown>): ImportResult {
	return parseGameExport(
		JSON.stringify({ format: GAME_EXPORT_FORMAT, version: GAME_EXPORT_VERSION, game }),
	);
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
	// Id créés ici plutôt qu'à l'ajout : le départage, donné par position, les désigne déjà.
	const ids = game.categories.map(() => createId());
	const categories = game.categories.map((c, index) => ({
		id: ids[index],
		label: c.label,
		color: c.color ?? paletteColor(index),
		brick: importBrick(
			// Le schéma garantit une position valide, placée avant le multiplicateur.
			c.brick.kind === "product" ? { kind: "product", sourceId: ids[c.brick.source] } : c.brick,
		),
		...(c.requiresValidation && { requiresValidation: true }),
	}));
	return {
		ok: true,
		game: {
			name: game.name,
			minPlayers: game.minPlayers,
			maxPlayers: game.maxPlayers,
			rounds: game.rounds ?? 1,
			...(game.openRounds && { openRounds: game.openRounds }),
			categories,
			...(game.lowestWins && { lowestWins: true }),
			...(game.teamPlay && { teamPlay: true }),
			...(game.tieBreaker !== undefined && { tieBreakerId: categories[game.tieBreaker].id }),
		},
	};
}
