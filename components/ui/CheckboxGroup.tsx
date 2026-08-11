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
	values: T[];
	onChange: (values: T[]) => void;
};

/** Groupe de boutons à sélection multiple (chaque option se coche/décoche indépendamment). */
export function CheckboxGroup<T extends string>({ options, values, onChange }: Props<T>) {
	const colors = useColors();
	const styles = useStyles(colors);

	const toggle = (value: T) => {
		selectFeedback();
		onChange(values.includes(value) ? values.filter((v) => v !== value) : [...values, value]);
	};

	return (
		<View style={styles.row}>
			{options.map((option) => {
				const checked = values.includes(option.value);
				return (
					<Pressable
						key={option.value}
						style={[styles.option, checked && styles.optionChecked]}
						onPress={() => toggle(option.value)}
						accessibilityRole="checkbox"
						accessibilityState={{ checked }}
						accessibilityLabel={option.label}
					>
						<Text style={[styles.label, checked && styles.labelChecked]}>{option.label}</Text>
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
					gap: 8,
				},
				option: {
					paddingVertical: 8,
					paddingHorizontal: 12,
					borderRadius: RADIUS.full,
					borderWidth: 1.5,
					borderColor: colors.border,
				},
				optionChecked: {
					backgroundColor: colors.primary,
					borderColor: colors.primary,
				},
				label: {
					color: colors.textMuted,
					fontSize: 13,
					fontWeight: "600",
				},
				labelChecked: {
					color: colors.primaryText,
				},
			}),
		[colors],
	);
}
