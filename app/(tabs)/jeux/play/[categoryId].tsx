import { Ionicons } from "@expo/vector-icons";
import { useKeepAwake } from "expo-keep-awake";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PlayerOrderSheet } from "@/components/players/PlayerOrderSheet";
import { PlayerScoreRow } from "@/components/players/PlayerScoreRow";
import { CategoryScoreField } from "@/components/scoring/CategoryScoreField";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { SwipeView } from "@/components/ui/SwipeView";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { getRoundCount, scoreKey } from "@/lib/rounds";
import { computeEntryTotal } from "@/lib/scoring";
import { getScoringSteps, getStepHref } from "@/lib/sessionFlow";
import { useGamesStore } from "@/stores/gamesStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

export default function PlayScoreScreen() {
	const params = useLocalSearchParams<{ categoryId: string; round?: string }>();
	const { categoryId } = params;
	// Manche absente de l'URL (lien d'avant les manches) : la première.
	const round = Number(params.round) || 1;
	const router = useRouter();
	const colors = useColors();
	const styles = useStyles(colors);
	const gameDefId = useSessionStore((s) => s.gameDefId);
	const playerIds = useSessionStore((s) => s.playerIds);
	const entries = useSessionStore((s) => s.entries);
	const updateScore = useSessionStore((s) => s.updateScore);
	const setCurrentCategory = useSessionStore((s) => s.setCurrentCategory);
	const movePlayer = useSessionStore((s) => s.movePlayer);
	const game = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));
	const allPlayers = usePlayersStore((s) => s.players);
	const [orderOpen, setOrderOpen] = useState(false);
	// Entre deux catégories, le téléphone reste posé sur la table : il ne doit pas se mettre en veille.
	useKeepAwake();

	useEffect(() => {
		if (playerIds.length === 0) router.replace("/jeux");
	}, [playerIds, router]);

	// Mémorise l'étape affichée pour que "Reprendre la partie" y ramène directement.
	useEffect(() => {
		if (categoryId) setCurrentCategory(categoryId, round);
	}, [categoryId, round, setCurrentCategory]);

	if (!game || playerIds.length === 0) return null;

	const steps = getScoringSteps(game);
	const index = steps.findIndex((s) => s.categoryId === categoryId && s.round === round);
	if (index === -1) return null;

	const category = game.categories.find((c) => c.id === categoryId);
	if (!category) return null;
	const key = scoreKey(category.id, round);
	const roundCount = getRoundCount(game);
	const categoryCount = game.categories.length;
	const isLast = index === steps.length - 1;
	const nextCategory = isLast
		? undefined
		: game.categories.find((c) => c.id === steps[index + 1].categoryId);
	const gamePlayers = playerIds
		.map((id) => allPlayers.find((p) => p.id === id))
		.filter((p): p is NonNullable<typeof p> => p != null);

	const goNext = () => {
		if (isLast) {
			router.push("/jeux/play/results");
		} else {
			router.push(getStepHref(steps[index + 1]));
		}
	};

	// dismissTo plutôt que back : après une reprise en cours de partie, l'étape précédente n'est pas
	// dans la pile (on arrive directement sur l'étape mémorisée). dismissTo y revient si elle est
	// empilée, sinon remplace l'écran courant par elle, sans quitter la saisie.
	const goPrevious = () => {
		router.dismissTo(getStepHref(steps[index - 1]));
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
						<View style={styles.headerRight}>
							{gamePlayers.length > 1 && (
								<Pressable
									onPress={() => setOrderOpen(true)}
									hitSlop={12}
									accessibilityRole="button"
									accessibilityLabel="Ordre des joueurs"
								>
									<Ionicons name="swap-vertical" size={24} color={colors.text} />
								</Pressable>
							)}
							<Pressable
								onPress={goNext}
								hitSlop={12}
								accessibilityRole="button"
								accessibilityLabel={isLast ? "Voir les résultats" : "Étape suivante"}
							>
								<Ionicons
									name={isLast ? "trophy" : "arrow-forward"}
									size={24}
									color={colors.text}
								/>
							</Pressable>
						</View>
					),
				}}
			/>

			<SwipeView
				style={styles.body}
				onSwipeLeft={goNext}
				onSwipeRight={index > 0 ? goPrevious : undefined}
			>
				<View style={[styles.progressBar, { backgroundColor: colors.surfaceAlt }]}>
					<View
						style={[
							styles.progressFill,
							{
								backgroundColor: category.color,
								width: `${((index + 1) / steps.length) * 100}%`,
							},
						]}
					/>
				</View>
				{roundCount > 1 ? (
					<Text style={styles.progress}>
						<Text style={styles.round}>
							Manche {round} / {roundCount}
						</Text>
						{"  ·  "}Étape {(index % categoryCount) + 1} / {categoryCount}
					</Text>
				) : (
					<Text style={styles.progress}>
						Étape {index + 1} / {steps.length}
					</Text>
				)}

				<ScrollView contentContainerStyle={styles.list}>
					{gamePlayers.map((player) => {
						const entry = entries[player.id];
						if (!entry) return null;
						return (
							<PlayerScoreRow key={player.id} player={player} total={computeEntryTotal(entry)}>
								<CategoryScoreField
									category={category}
									points={entry.scores[key]}
									onChange={(value) => updateScore(player.id, key, value)}
								/>
							</PlayerScoreRow>
						);
					})}
				</ScrollView>
				{/* En plus de l'icône d'en-tête : à portée de pouce, et annonce la catégorie suivante. */}
				<Button
					label={nextCategory ? `Suivant : ${nextCategory.label}` : "Voir le classement"}
					variant={nextCategory ? "primary" : "success"}
					onPress={goNext}
					style={styles.nextButton}
				/>
			</SwipeView>

			<PlayerOrderSheet
				visible={orderOpen}
				onClose={() => setOrderOpen(false)}
				players={gamePlayers}
				onMove={movePlayer}
			/>
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
				body: {
					flex: 1,
				},
				nextButton: {
					marginHorizontal: SPACING.md,
					marginBottom: SPACING.md,
				},
				headerRight: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.lg,
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
				round: {
					color: colors.text,
					fontWeight: "700",
				},
				list: {
					gap: SPACING.sm,
					padding: SPACING.md,
				},
			}),
		[colors],
	);
}
