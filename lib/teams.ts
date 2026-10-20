import { createId } from "@/lib/uuid";
import type { Team } from "@/types/game";

/** Équipe de chaque joueur choisi (index à partir de 0), par id de joueur. */
export type TeamAssignment = Record<string, number>;

export const MIN_TEAMS = 2;

export function teamName(index: number): string {
	return `Équipe ${index + 1}`;
}

/** Équipe d'un joueur : celle choisie si elle existe encore, sinon répartition à tour de rôle
 * dans l'ordre de sélection (1, 2, 1, 2…). */
export function teamOf(
	assignment: TeamAssignment,
	playerIds: string[],
	playerId: string,
	teamCount: number,
): number {
	const chosen = assignment[playerId];
	if (chosen !== undefined && chosen < teamCount) return chosen;
	return Math.max(0, playerIds.indexOf(playerId)) % teamCount;
}

/** Équipes de la partie, dans leur ordre, sans équipe vide. */
export function buildTeams(
	playerIds: string[],
	assignment: TeamAssignment,
	teamCount: number,
): Team[] {
	return Array.from({ length: teamCount }, (_, index) => ({
		id: createId(),
		name: teamName(index),
		playerIds: playerIds.filter((id) => teamOf(assignment, playerIds, id, teamCount) === index),
	})).filter((team) => team.playerIds.length > 0);
}

/** Joueurs regroupés par équipe : l'ordre de saisie suit les équipes. */
export function playersByTeam(teams: Team[]): string[] {
	return teams.flatMap((team) => team.playerIds);
}

/**
 * Équipes d'une partie rejouée : celles de la partie d'origine, réduites aux joueurs encore
 * disponibles. `null` s'il n'en reste pas assez pour jouer en équipes.
 */
export function replayTeams(teams: Team[] | undefined, availableIds: string[]): Team[] | null {
	const kept = (teams ?? [])
		.map((team) => ({
			id: createId(),
			name: team.name,
			playerIds: team.playerIds.filter((id) => availableIds.includes(id)),
		}))
		.filter((team) => team.playerIds.length > 0);
	const everyoneHasATeam = availableIds.every((id) => kept.some((t) => t.playerIds.includes(id)));
	return kept.length >= MIN_TEAMS && everyoneHasATeam ? kept : null;
}
