import { RankedPlayerCard } from "@/components/scoring/RankedPlayerCard";
import { TeamRankingCard } from "@/components/scoring/TeamRankingCard";
import { getRoundCount } from "@/lib/rounds";
import type { SessionRanking as Ranking } from "@/lib/scoring";
import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	session: Session;
	/** Absent si le jeu a été supprimé depuis : le classement reste affiché, sans catégories. */
	game: GameDef | undefined;
	ranking: Ranking;
	players: Player[];
	playersById: ReadonlyMap<string, Player>;
};

/** Classement final d'une partie passée : équipes s'il y en a, puis joueurs. */
export function SessionRanking({ session, game, ranking, players, playersById }: Props) {
	return (
		<>
			{ranking.teams?.map((team) => (
				<TeamRankingCard key={team.teamId} team={team} playersById={playersById} />
			))}
			{ranking.players.map((ranked) => {
				const player = players.find((p) => p.id === ranked.playerId);
				const entry = session.entries[ranked.playerId];
				if (!entry) return null;
				return (
					<RankedPlayerCard
						key={ranked.playerId}
						player={player}
						ranked={ranked}
						entry={entry}
						categories={game?.categories ?? []}
						roundCount={game ? getRoundCount(game) : 1}
					/>
				);
			})}
		</>
	);
}
