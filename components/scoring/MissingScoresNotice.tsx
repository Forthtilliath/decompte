import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { MissingStep } from "@/lib/sessionFlow";
import type { CategoryDef } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	steps: MissingStep[];
	categories: CategoryDef[];
	players: ReadonlyMap<string, Player>;
	roundCount: number;
	/** Ouvre l'étape pour la compléter. */
	onOpen: (step: MissingStep) => void;
};

/** Avant d'enregistrer : les catégories qu'un joueur n'a jamais saisies (comptées 0). */
export function MissingScoresNotice({ steps, categories, players, roundCount, onOpen }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	if (steps.length === 0) return null;

	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<Ionicons name="alert-circle-outline" size={18} color={colors.gold} />
				<Text style={styles.title}>Non saisi, compté 0</Text>
			</View>
			{steps.map((step) => {
				const category = categories.find((c) => c.id === step.categoryId);
				const label = roundCount > 1 ? `${category?.label}, manche ${step.round}` : category?.label;
				const names = step.playerIds.map((id) => players.get(id)?.name ?? "?").join(", ");
				return (
					<Pressable
						key={`${step.categoryId}#${step.round}`}
						style={styles.row}
						onPress={() => onOpen(step)}
						accessibilityRole="button"
						accessibilityLabel={`Compléter ${label} : ${names}`}
					>
						<Text style={styles.rowText}>
							<Text style={styles.category}>{label}</Text> : {names}
						</Text>
						<Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
					</Pressable>
				);
			})}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					gap: SPACING.xs,
					padding: SPACING.md,
					borderRadius: RADIUS.md,
					borderWidth: 1,
					borderColor: colors.gold,
					backgroundColor: colors.surface,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.xs,
				},
				title: {
					color: colors.text,
					fontSize: 14,
					fontWeight: "700",
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: SPACING.sm,
					paddingVertical: SPACING.xs,
				},
				rowText: {
					flex: 1,
					color: colors.textMuted,
					fontSize: 13,
				},
				category: {
					color: colors.text,
					fontWeight: "600",
				},
			}),
		[colors],
	);
}
