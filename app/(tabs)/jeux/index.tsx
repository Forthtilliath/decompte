import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { GameListItem } from "@/components/games/GameListItem";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import { UpdateBanner } from "@/components/updates/UpdateBanner";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useOngoingSession } from "@/hooks/useOngoingSession";
import { matchesSearch, normalizeForSearch } from "@/lib/search";
import { useGamesStore } from "@/stores/gamesStore";

export default function GamesListScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const games = useGamesStore((s) => s.games);
	const { hasOngoingSession, ongoingGame, isOrphan, resume, confirmAbandon } = useOngoingSession();
	const [query, setQuery] = useState("");

	const activeGames = useMemo(() => games.filter((g) => !g.isArchived), [games]);
	const filteredGames = useMemo(() => {
		const needle = normalizeForSearch(query);
		return needle.length === 0
			? activeGames
			: activeGames.filter((g) => matchesSearch(g.name, needle));
	}, [activeGames, query]);
	const createGame = () => router.push("/jeux/new");

	return (
		<ScreenContainer style={styles.container}>
			<UpdateBanner />
			{hasOngoingSession && ongoingGame && (
				<Button
					label={`Reprendre la partie en cours (${ongoingGame.name})`}
					variant="success"
					onPress={resume}
				/>
			)}
			{isOrphan && (
				<Text style={styles.orphan}>
					Une partie est en cours sur un jeu qui n'existe plus sur ce téléphone (retiré par une
					restauration). Elle ne peut pas être reprise : abandonne-la pour en lancer une autre.
				</Text>
			)}
			{/* Proposé même si le jeu de la partie est introuvable : sinon la partie bloquerait le
			    lancement de toute autre partie, sans aucun moyen d'en sortir. */}
			{hasOngoingSession && (
				<Button label="Abandonner la partie en cours" variant="ghost" onPress={confirmAbandon} />
			)}

			{activeGames.length > 0 && (
				<TextField
					placeholder="Rechercher un jeu..."
					value={query}
					onChangeText={setQuery}
					autoCapitalize="none"
				/>
			)}

			{activeGames.length === 0 ? (
				<EmptyState
					icon="game-controller-outline"
					message="Aucun jeu créé pour l'instant. Crée ton premier jeu pour définir ses catégories de score, ou pars d'un modèle."
					action={{ label: "Créer un jeu", onPress: createGame }}
				/>
			) : filteredGames.length === 0 ? (
				<EmptyState icon="search" message="Aucun jeu ne correspond à cette recherche." />
			) : (
				filteredGames.map((game) => (
					<GameListItem key={game.id} game={game} onPress={() => router.push(`/jeux/${game.id}`)} />
				))
			)}

			{/* Sans jeu, le bouton est déjà dans l'état vide, plus haut. */}
			{activeGames.length > 0 && <Button label="Créer un jeu" onPress={createGame} />}
			<Button
				label="Partir d'un modèle"
				variant="secondary"
				onPress={() => router.push("/jeux/modeles")}
			/>
			<Button
				label="Importer un jeu partagé"
				variant="ghost"
				onPress={() => router.push("/jeux/import")}
			/>
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
				orphan: {
					color: colors.textMuted,
					textAlign: "center",
				},
			}),
		[colors],
	);
}
