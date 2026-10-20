import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	checked: boolean;
	/** Couleur de la catégorie, pour la case cochée. */
	color: string;
	onChange: (checked: boolean) => void;
};

/** Case « Critère validé » d'une catégorie à critère : décochée, ses points ne comptent pas. */
export function ValidationCheckbox({ checked, color, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Pressable
			style={styles.row}
			onPress={() => {
				selectFeedback();
				onChange(!checked);
			}}
			hitSlop={8}
			accessibilityRole="checkbox"
			accessibilityState={{ checked }}
			accessibilityLabel="Critère validé"
		>
			<Ionicons
				name={checked ? "checkbox" : "square-outline"}
				size={24}
				color={checked ? color : colors.textMuted}
			/>
			<Text style={styles.label}>Critère validé</Text>
			{!checked && <Text style={styles.hint}>Points non comptés</Text>}
		</Pressable>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				label: {
					flex: 1,
					color: colors.text,
					fontSize: 15,
					fontWeight: "600",
				},
				hint: {
					color: colors.textMuted,
					fontSize: 12,
				},
			}),
		[colors],
	);
}
