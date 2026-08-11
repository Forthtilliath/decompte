import { useMemo } from "react";
import { StyleSheet, Text, TextInput, type TextInputProps, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = TextInputProps & {
	label?: string;
};

export function TextField({ label, style, ...rest }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.wrapper}>
			{label ? <Text style={styles.label}>{label}</Text> : null}
			<TextInput
				placeholderTextColor={colors.textMuted}
				style={[styles.input, style]}
				accessibilityLabel={label ?? rest.placeholder}
				{...rest}
			/>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				wrapper: {
					gap: SPACING.xs,
				},
				label: {
					color: colors.textMuted,
					fontSize: 14,
				},
				input: {
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.border,
					borderRadius: RADIUS.md,
					paddingHorizontal: SPACING.md,
					paddingVertical: SPACING.sm,
					color: colors.text,
					fontSize: 16,
				},
			}),
		[colors],
	);
}
