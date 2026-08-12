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
