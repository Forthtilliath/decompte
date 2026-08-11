import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useGamesStore } from "@/stores/gamesStore";
import { useSessionStore } from "@/stores/sessionStore";

export default function GamesListScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const games = useGamesStore((s) => s.games);
	const hasOngoingSession = useSessionStore((s) => s.hasOngoingSession());
	const sessionGameDefId = useSessionStore((s) => s.gameDefId);

	const activeGames = games.filter((g) => !g.isArchived);
	const ongoingGame = games.find((g) => g.id === sessionGameDefId);

	return (
		<ScreenContainer style={styles.container}>
			{hasOngoingSession && ongoingGame && (
				<Button
					label={`Reprendre la partie en cours (${ongoingGame.name})`}
					onPress={() => router.push(`/jeux/play/${ongoingGame.categories[0]?.id}`)}
				/>
			)}

			{activeGames.length === 0 ? (
				<Text style={styles.empty}>
					Aucun jeu créé pour l'instant. Crée ton premier jeu pour définir ses catégories de score.
				</Text>
			) : (
				activeGames.map((game) => (
					<SettingsRow
						key={game.id}
						icon="game-controller-outline"
						label={game.name}
						value={`${game.categories.length} catégorie${game.categories.length > 1 ? "s" : ""}`}
						onPress={() => router.push(`/jeux/${game.id}`)}
					/>
				))
			)}

			<Button label="Créer un jeu" onPress={() => router.push("/jeux/new")} />
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.sm,
				},
				empty: {
					color: colors.textMuted,
					textAlign: "center",
					marginVertical: SPACING.lg,
				},
			}),
		[colors],
	);
}
