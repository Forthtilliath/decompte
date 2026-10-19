import { createPluralize } from "@forthtilliath/ts-kit/string/pluralize";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { RankingRow } from "@/components/stats/RankingRow";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { SPACING } from "@/constants/theme";
import { formatDate } from "@/lib/date";
import { computeGamePlayStats } from "@/lib/stats";
import type { GameDef, Session } from "@/types/game";

const plural = createPluralize("fr");

type Props = {
	sessions: Session[];
	games: GameDef[];
	/** Toucher un jeu filtre les statistiques sur lui. */
	onSelectGame: (id: string) => void;
};

/** Jeux de l'historique, du plus joué au moins joué. */
export function GamesSection({ sessions, games, onSelectGame }: Props) {
	const stats = useMemo(() => computeGamePlayStats(sessions), [sessions]);

	return (
		<View style={styles.section}>
			<SectionTitle>Jeux les plus joués</SectionTitle>
			{stats.map((entry, index) => {
				const game = games.find((g) => g.id === entry.gameDefId);
				return (
					<RankingRow
						key={entry.gameDefId}
						rank={index + 1}
						title={game?.name ?? "Jeu inconnu"}
						meta={`Dernière partie le ${formatDate(entry.lastPlayedAt)}`}
						value={`${entry.sessionsPlayed} ${plural(entry.sessionsPlayed, "partie")}`}
						onPress={game ? () => onSelectGame(game.id) : undefined}
					/>
				);
			})}
		</View>
	);
}

const styles = StyleSheet.create({
	section: {
		gap: SPACING.xs,
	},
});
