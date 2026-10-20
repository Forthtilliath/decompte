import type { Session } from "@/types/game";
import type { Player } from "@/types/player";

/**
 * Vrai si un autre joueur (que `excludeId`, pour ignorer le joueur qu'on est en train de
 * renommer) porte déjà ce nom, insensible à la casse et aux espaces superflus. Ne bloque rien :
 * sert juste à avertir l'utilisateur (deux personnes peuvent légitimement s'appeler pareil).
 */
export function hasDuplicateName(players: Player[], name: string, excludeId?: string): boolean {
	const normalized = name.trim().toLowerCase();
	if (!normalized) return false;
	return players.some((p) => p.id !== excludeId && p.name.trim().toLowerCase() === normalized);
}

/**
 * Sélection après un appui sur `id` : le retire s'il était choisi, sinon l'ajoute tant que la
 * limite `max` n'est pas atteinte (au-delà, la sélection ne change pas).
 */
export function toggleSelection(selected: string[], id: string, max: number): string[] {
	if (selected.includes(id)) return selected.filter((s) => s !== id);
	if (selected.length >= max) return selected;
	return [...selected, id];
}

/**
 * Sélection après un appui sur un groupe (`groupIds` : ses joueurs disponibles, dans l'ordre du
 * groupe). Groupe déjà entièrement choisi : ses joueurs sont retirés. Sinon ses joueurs manquants
 * sont ajoutés à la suite, dans l'ordre du groupe, tant que la limite `max` n'est pas atteinte.
 */
export function toggleGroupSelection(
	selected: string[],
	groupIds: string[],
	max: number,
): string[] {
	if (isGroupSelected(selected, groupIds)) return selected.filter((id) => !groupIds.includes(id));
	const missing = groupIds.filter((id) => !selected.includes(id));
	return [...selected, ...missing.slice(0, Math.max(0, max - selected.length))];
}

/** Vrai si tous les joueurs du groupe (non vide) sont dans la sélection. */
export function isGroupSelected(selected: string[], groupIds: string[]): boolean {
	return groupIds.length > 0 && groupIds.every((id) => selected.includes(id));
}

/** Nombre de parties enregistrées de chaque joueur. */
export function countPlays(sessions: Session[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const session of sessions) {
		for (const id of session.playerIds) counts.set(id, (counts.get(id) ?? 0) + 1);
	}
	return counts;
}

/**
 * Ordre de la grille de sélection : favoris d'abord, puis les joueurs qui ont le plus de parties,
 * puis l'ordre alphabétique.
 */
export function sortForSelection(players: Player[], playCounts: Map<string, number>): Player[] {
	return [...players].sort((a, b) => {
		if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
		const plays = (playCounts.get(b.id) ?? 0) - (playCounts.get(a.id) ?? 0);
		return plays !== 0 ? plays : a.name.localeCompare(b.name);
	});
}
