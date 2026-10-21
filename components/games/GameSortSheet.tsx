import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { GAME_SORT_LABELS, GAME_SORT_ORDERS, type GameSortOrder } from "@/lib/gameSort";

type Props = {
	visible: boolean;
	onClose: () => void;
	value: GameSortOrder;
	onChange: (order: GameSortOrder) => void;
};

/** Choix de l'ordre de la liste des jeux ; la feuille se ferme dès qu'un ordre est choisi. */
export function GameSortSheet({ visible, onClose, value, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<BottomSheet visible={visible} onClose={onClose} title="Trier les jeux">
			<View style={styles.content} accessibilityRole="radiogroup">
				{GAME_SORT_ORDERS.map((order) => {
					const selected = order === value;
					return (
						<Pressable
							key={order}
							style={[styles.option, selected && styles.optionSelected]}
							onPress={() => {
								selectFeedback();
								onChange(order);
								onClose();
							}}
							accessibilityRole="radio"
							accessibilityState={{ checked: selected }}
							accessibilityLabel={GAME_SORT_LABELS[order]}
						>
							<Text style={styles.optionLabel}>{GAME_SORT_LABELS[order]}</Text>
							{selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
						</Pressable>
					);
				})}
			</View>
		</BottomSheet>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.xs,
					paddingBottom: SPACING.md,
				},
				option: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					minHeight: 44,
					paddingHorizontal: SPACING.sm,
					paddingVertical: SPACING.xs,
					borderRadius: RADIUS.md,
				},
				optionSelected: {
					backgroundColor: colors.surfaceAlt,
				},
				optionLabel: {
					flex: 1,
					color: colors.text,
					fontSize: 15,
				},
			}),
		[colors],
	);
}
