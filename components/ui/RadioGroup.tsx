import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { selectFeedback } from "@/lib/haptics";

type Option<T extends string> = {
	value: T;
	label: string;
};

type Props<T extends string> = {
	options: Option<T>[];
	value: T | null;
	onChange: (value: T) => void;
};

export function RadioGroup<T extends string>({ options, value, onChange }: Props<T>) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.row}>
			{options.map((option) => {
				const selected = value === option.value;
				return (
					<Pressable
						key={option.value}
						style={[styles.option, selected && styles.optionSelected]}
						onPress={() => {
							selectFeedback();
							onChange(option.value);
						}}
						accessibilityRole="radio"
						accessibilityState={{ selected }}
						accessibilityLabel={option.label}
					>
						<Text style={[styles.label, selected && styles.labelSelected]}>{option.label}</Text>
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
					gap: 8,
				},
				option: {
					flex: 1,
					paddingVertical: 8,
					borderRadius: RADIUS.sm,
					borderWidth: 1.5,
					borderColor: colors.border,
					alignItems: "center",
				},
				optionSelected: {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
				},
				label: {
					color: colors.textMuted,
					fontSize: 13,
					fontWeight: "600",
				},
				labelSelected: {
					color: colors.primaryText,
				},
			}),
		[colors],
	);
}
