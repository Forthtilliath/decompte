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
