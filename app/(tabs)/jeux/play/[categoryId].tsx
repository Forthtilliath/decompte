import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PlayerScoreRow } from "@/components/players/PlayerScoreRow";
import { CategoryScoreField } from "@/components/scoring/CategoryScoreField";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { computeEntryTotal } from "@/lib/scoring";
import { useGamesStore } from "@/stores/gamesStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

export default function PlayScoreScreen() {
	const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const gameDefId = useSessionStore((s) => s.gameDefId);
	const playerIds = useSessionStore((s) => s.playerIds);
	const entries = useSessionStore((s) => s.entries);
	const updateScore = useSessionStore((s) => s.updateScore);
	const setCurrentCategory = useSessionStore((s) => s.setCurrentCategory);
	const game = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));
	const allPlayers = usePlayersStore((s) => s.players);

	useEffect(() => {
		if (playerIds.length === 0) router.replace("/jeux");
	}, [playerIds, router]);

	// Mémorise l'étape affichée pour que "Reprendre la partie" y ramène directement.
	useEffect(() => {
		if (categoryId) setCurrentCategory(categoryId);
	}, [categoryId, setCurrentCategory]);

	if (!game || playerIds.length === 0) return null;

	const categories = game.categories;
	const index = categories.findIndex((c) => c.id === categoryId);
	if (index === -1) return null;

	const category = categories[index];
	const isLast = index === categories.length - 1;
	const gamePlayers = playerIds
		.map((id) => allPlayers.find((p) => p.id === id))
		.filter((p): p is NonNullable<typeof p> => p != null);

	const goNext = () => {
		if (isLast) {
			router.push("/jeux/play/results");
		} else {
			router.push(`/jeux/play/${categories[index + 1].id}`);
		}
	};

	// dismissTo plutôt que back : après une reprise en cours de partie, l'étape précédente n'est pas
	// dans la pile (on arrive directement sur l'étape mémorisée). dismissTo y revient si elle est
	// empilée, sinon remplace l'écran courant par elle, sans quitter la saisie.
	const goPrevious = () => {
		router.dismissTo(`/jeux/play/${categories[index - 1].id}`);
	};

	return (
		<ScreenContainer padded={false}>
			<Stack.Screen
				options={{
					title: category.label,
					headerLeft:
						index > 0
							? () => (
									<Pressable
										onPress={goPrevious}
										hitSlop={12}
										style={styles.headerLeft}
										accessibilityRole="button"
										accessibilityLabel="Étape précédente"
									>
										<Ionicons name="arrow-back" size={24} color={colors.text} />
									</Pressable>
								)
							: undefined,
					headerRight: () => (
						<Pressable
							onPress={goNext}
							hitSlop={12}
							accessibilityRole="button"
							accessibilityLabel={isLast ? "Voir les résultats" : "Étape suivante"}
						>
							<Ionicons name={isLast ? "trophy" : "arrow-forward"} size={24} color={colors.text} />
						</Pressable>
					),
				}}
			/>

			<View style={[styles.progressBar, { backgroundColor: colors.surfaceAlt }]}>
				<View
					style={[
						styles.progressFill,
						{
							backgroundColor: category.color,
							width: `${((index + 1) / categories.length) * 100}%`,
						},
					]}
				/>
			</View>
			<Text style={styles.progress}>
				Étape {index + 1} / {categories.length}
			</Text>

			<ScrollView contentContainerStyle={styles.list}>
				{gamePlayers.map((player) => {
					const entry = entries[player.id];
					if (!entry) return null;
					return (
						<PlayerScoreRow key={player.id} player={player} total={computeEntryTotal(entry)}>
							<CategoryScoreField
								category={category}
								points={entry.scores[category.id]}
								onChange={(value) => updateScore(player.id, category.id, value)}
							/>
						</PlayerScoreRow>
					);
				})}
			</ScrollView>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				headerLeft: {
					marginRight: SPACING.md,
				},
				progressBar: {
					height: 4,
				},
				progressFill: {
					height: "100%",
				},
				progress: {
					color: colors.textMuted,
					fontSize: 12,
					textAlign: "center",
					paddingVertical: SPACING.xs,
				},
				list: {
					gap: SPACING.sm,
					padding: SPACING.md,
				},
			}),
		[colors],
	);
}
