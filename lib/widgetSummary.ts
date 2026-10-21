import { formatDate } from "@/lib/date";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { getFullSessionRanking } from "@/lib/stats";
import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

/** Ce que montre le widget d'écran d'accueil. */
export type WidgetSummary =
	| { kind: "ongoing"; gameName: string; playerCount: number }
	| { kind: "lastWinner"; gameName: string; winners: string; total: number; date: string }
	| { kind: "empty" };

export type WidgetData = {
	/** Jeu de la partie en cours, `null` sans partie en cours. */
	ongoingGameId: string | null;
	ongoingPlayerCount: number;
	/** Historique, la plus récente en tête (comme le store). */
	sessions: Session[];
	games: GameDef[];
	players: Player[];
};

/**
 * Partie en cours à reprendre, sinon vainqueur(s) de la dernière partie : l'équipe en tête pour une
 * partie en équipes, tous les ex æquo sinon.
 */
export function computeWidgetSummary(data: WidgetData): WidgetSummary {
	const gameName = (id: string) => data.games.find((g) => g.id === id)?.name ?? "Jeu introuvable";

	if (data.ongoingGameId) {
		return {
			kind: "ongoing",
			gameName: gameName(data.ongoingGameId),
			playerCount: data.ongoingPlayerCount,
		};
	}

	const last = data.sessions[0];
	if (!last) return { kind: "empty" };
	const ranking = getFullSessionRanking(last);
	const playerName = (id: string) =>
		data.players.find((p) => p.id === id)?.name ?? DELETED_PLAYER_LABEL;
	const leaders = ranking.teams
		? ranking.teams.filter((t) => t.rank === 1).map((t) => ({ name: t.name, total: t.total }))
		: ranking.players
				.filter((r) => r.rank === 1)
				.map((r) => ({ name: playerName(r.playerId), total: r.total }));
	if (leaders.length === 0) return { kind: "empty" };

	return {
		kind: "lastWinner",
		gameName: gameName(last.gameDefId),
		winners: leaders.map((l) => l.name).join(", "),
		total: leaders[0].total,
		date: formatDate(last.finishedAt ?? last.createdAt),
	};
}
