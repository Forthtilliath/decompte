import { escapeCsvField } from "@forthtilliath/ts-kit/csv/escapeCsvField";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { sumByCategory } from "@/lib/rounds";
import { getFullSessionRanking } from "@/lib/stats";
import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

// Point-virgule : le séparateur qu'attend un tableur réglé en français.
const DELIMITER = ";";

/** Marque d'ordre des octets : sans elle, Excel lit le fichier UTF-8 comme du Windows-1252. */
const BOM = String.fromCharCode(0xfeff);

const HEADER = ["Date", "Jeu", "Joueur", "Équipe", "Rang", "Total", "Détail", "Notes"];

/**
 * Texte saisi par l'utilisateur (nom, libellé, notes) : un tableur exécuterait comme formule une
 * cellule qui commence par = + - @ (injection de formule, ex. `=HYPERLINK(…)` dans un nom de
 * joueur). Une apostrophe en tête la fait lire comme du texte.
 */
function textCell(value: string): string {
	return escapeCsvField(/^[=+\-@\t\r]/.test(value) ? `'${value}` : value, DELIMITER);
}

function numberCell(value: number): string {
	return String(value);
}

/** Date au format AAAA-MM-JJ (heure locale) : triable et reconnue par les tableurs. */
function isoDate(timestamp: number): string {
	const date = new Date(timestamp);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Historique en CSV, une ligne par joueur et par partie, dans l'ordre du classement : date, jeu,
 * joueur, équipe, rang, total, détail des points par catégorie, notes de la partie. Précédé d'un
 * BOM pour qu'Excel lise les accents en UTF-8.
 */
export function buildHistoryCsv(
	sessions: Session[],
	gamesById: ReadonlyMap<string, GameDef>,
	playersById: ReadonlyMap<string, Player>,
): string {
	const rows = sessions.flatMap((session) => {
		const game = gamesById.get(session.gameDefId);
		const labels = new Map(game?.categories.map((c) => [c.id, c.label]));
		const teamOf = new Map(
			session.teams?.flatMap((team) => team.playerIds.map((id) => [id, team.name])),
		);
		return getFullSessionRanking(session).players.map((ranked) => {
			const scores = sumByCategory(session.entries[ranked.playerId]?.scores ?? {});
			const detail = Object.entries(scores)
				.map(([id, points]) => `${labels.get(id) ?? "Catégorie retirée"} : ${points}`)
				.join(" | ");
			return [
				isoDate(session.createdAt),
				textCell(game?.name ?? "Jeu introuvable"),
				textCell(playersById.get(ranked.playerId)?.name ?? DELETED_PLAYER_LABEL),
				textCell(teamOf.get(ranked.playerId) ?? ""),
				numberCell(ranked.rank),
				numberCell(ranked.total),
				textCell(detail),
				textCell(session.notes ?? ""),
			];
		});
	});
	const lines = [HEADER.map(textCell), ...rows].map((row) => row.join(DELIMITER));
	return `${BOM}${lines.join("\r\n")}`;
}
