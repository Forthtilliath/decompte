import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PageBackground } from "@/constants/backgrounds";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	options: readonly PageBackground[];
	value: string;
	onChange: (id: string) => void;
};

/** Choix du fond : chaque pastille montre la page et une carte dans les teintes proposées. */
export function BackgroundPicker({ options, value, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.row} accessibilityRole="radiogroup">
			{options.map((option) => {
				const selected = option.id === value;
				return (
					<Pressable
						key={option.id}
						style={styles.option}
						onPress={() => {
							selectFeedback();
							onChange(option.id);
						}}
						accessibilityRole="radio"
						accessibilityState={{ selected }}
						accessibilityLabel={option.label}
					>
						<View
							style={[
								styles.swatch,
								{ backgroundColor: option.colors.background },
								selected && styles.swatchSelected,
							]}
						>
							<View
								style={[
									styles.card,
									{
										backgroundColor: option.colors.surface,
										borderColor: option.colors.border,
									},
								]}
							/>
							{selected && (
								<View style={styles.check}>
									<Ionicons name="checkmark" size={14} color={colors.primaryText} />
								</View>
							)}
						</View>
						<Text style={[styles.label, selected && styles.labelSelected]} numberOfLines={1}>
							{option.label}
						</Text>
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
				row: {
					flexDirection: "row",
					flexWrap: "wrap",
					gap: SPACING.sm,
				},
				option: {
					flexGrow: 1,
					flexBasis: "22%",
					alignItems: "center",
					gap: SPACING.xs,
				},
				swatch: {
					width: "100%",
					aspectRatio: 1,
					borderRadius: RADIUS.md,
					borderWidth: 2,
					borderColor: colors.border,
					padding: SPACING.sm,
					justifyContent: "flex-end",
				},
				swatchSelected: {
					borderColor: colors.primary,
				},
				card: {
					height: "45%",
					borderRadius: RADIUS.sm,
					borderWidth: 1,
				},
				check: {
					position: "absolute",
					top: SPACING.xs,
					right: SPACING.xs,
					width: 22,
					height: 22,
					borderRadius: RADIUS.full,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
				label: {
					color: colors.textMuted,
					fontSize: 13,
					fontWeight: "600",
				},
				labelSelected: {
					color: colors.text,
				},
			}),
		[colors],
	);
}
