import { indexById } from "@forthtilliath/ts-kit/array/indexById";
import { useMemo, useState } from "react";
import { RoundStandings } from "@/components/scoring/RoundStandings";
import { Button } from "@/components/ui/Button";
import { DELETED_PLAYER_LABEL } from "@/lib/playerDeletion";
import { getRoundStandings } from "@/lib/roundRecap";
import { getLastScoredRound } from "@/lib/rounds";
import type { RankableSession } from "@/lib/scoring";
import type { Player } from "@/types/player";

type Props = {
	session: RankableSession;
	/** Manches prévues : en manches ouvertes, celles réellement jouées s'y ajoutent. */
	roundCount: number;
	/** Tous les joueurs connus : ceux supprimés depuis la partie s'affichent sous un libellé neutre. */
	players: Player[];
};

/** Bouton qui déplie le classement à la fin de chaque manche, pour une partie en plusieurs manches. */
export function RoundStandingsSection({ session, roundCount, players }: Props) {
	const [visible, setVisible] = useState(false);
	const playedRounds = Math.max(roundCount, getLastScoredRound(Object.values(session.entries)));
	const standings = useMemo(() => {
		if (!visible) return [];
		const playersById = indexById(players);
		const nameOf = (id: string) => playersById.get(id)?.name ?? DELETED_PLAYER_LABEL;
		return getRoundStandings(session, playedRounds, nameOf);
	}, [visible, session, playedRounds, players]);

	if (playedRounds <= 1) return null;

	return (
		<>
			<Button
				label={visible ? "Masquer le classement par manche" : "Voir le classement par manche"}
				variant="ghost"
				onPress={() => setVisible((v) => !v)}
			/>
			{visible && <RoundStandings standings={standings} />}
		</>
	);
}
