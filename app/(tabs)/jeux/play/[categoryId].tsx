import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text } from "react-native";
import { PlayerScoreRow } from "@/components/players/PlayerScoreRow";
import { BooleanScoreField } from "@/components/scoring/BooleanScoreField";
import { ChoiceScoreField } from "@/components/scoring/ChoiceScoreField";
import { ManualPointsFields } from "@/components/scoring/ManualPointsFields";
import { TokenScoreField } from "@/components/scoring/TokenScoreField";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
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
	const game = useGamesStore((s) => s.games.find((g) => g.id === gameDefId));
	const allPlayers = usePlayersStore((s) => s.players);

	useEffect(() => {
		if (playerIds.length === 0) router.replace("/jeux");
	}, [playerIds, router]);

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

	return (
		<ScreenContainer padded={false}>
			<Stack.Screen
				options={{
					title: category.label,
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

			<Text style={styles.progress}>
				Étape {index + 1} / {categories.length}
			</Text>

			<ScrollView contentContainerStyle={styles.list}>
				{gamePlayers.map((player) => {
					const entry = entries[player.id];
					const points = entry?.scores[category.id] ?? 0;
					return (
						<PlayerScoreRow key={player.id} player={player}>
							{category.brick.kind === "manual" && (
								<ManualPointsFields
									points={points}
									color={category.color}
									allowNegative={category.brick.allowNegative}
									max={category.brick.max}
									onChange={(value) => updateScore(player.id, category.id, value)}
								/>
							)}
							{category.brick.kind === "tokens" && (
								<TokenScoreField
									points={points}
									color={category.color}
									label={category.label}
									tokens={category.brick.tokens}
									onChange={(value) => updateScore(player.id, category.id, value)}
								/>
							)}
							{category.brick.kind === "choice" && (
								<ChoiceScoreField
									points={points}
									options={category.brick.options}
									onChange={(value) => updateScore(player.id, category.id, value)}
								/>
							)}
							{category.brick.kind === "boolean" && (
								<BooleanScoreField
									points={points}
									yesValue={category.brick.yesValue}
									noValue={category.brick.noValue}
									onChange={(value) => updateScore(player.id, category.id, value)}
								/>
							)}
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
