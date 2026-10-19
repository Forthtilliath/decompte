import { plural } from "@/lib/plural";
import type { Session } from "@/types/game";
import type { Player, PlayerGroup } from "@/types/player";

/** Affiché à la place d'un joueur supprimé dans l'historique, où ses scores restent comptés. */
export const DELETED_PLAYER_LABEL = "Joueur supprimé";

/** Où un joueur apparaît encore. */
export type PlayerUsage = {
	sessionCount: number;
	groupCount: number;
	inOngoingSession: boolean;
};

export function getPlayerUsage(
	playerId: string,
	sessions: Session[],
	groups: PlayerGroup[],
	ongoingPlayerIds: string[],
): PlayerUsage {
	return {
		sessionCount: sessions.filter((s) => s.playerIds.includes(playerId)).length,
		groupCount: groups.filter((g) => g.playerIds.includes(playerId)).length,
		inOngoingSession: ongoingPlayerIds.includes(playerId),
	};
}

/**
 * Message de la confirmation de suppression : ce que la suppression change, et l'archivage comme
 * alternative tant que le joueur n'est pas déjà archivé.
 */
export function describePlayerDeletion(player: Player, usage: PlayerUsage): string {
	const consequences = [
		usage.sessionCount > 0 &&
			`Ses scores restent dans ${usage.sessionCount} ${plural(usage.sessionCount, "partie")} de l'historique, sous « ${DELETED_PLAYER_LABEL} ».`,
		usage.groupCount > 0 &&
			`Il sera retiré de ${usage.groupCount} ${plural(usage.groupCount, "groupe")}.`,
	].filter(Boolean);

	const parts = [`${player.name} sera définitivement supprimé.`, ...consequences];
	if (!player.isArchived) parts.push("L'archiver le masque des listes sans rien changer d'autre.");
	return parts.join(" ");
}
