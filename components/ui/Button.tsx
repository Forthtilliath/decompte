import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { Pressable, type StyleProp, StyleSheet, Text, type ViewStyle } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { displayFont, RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

/** `success` (vert) : actions qui font avancer une partie (lancer, reprendre, terminer). */
type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

type Props = {
	label: string;
	onPress?: () => void;
	variant?: Variant;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	/** Libellé lu par le lecteur d'écran, si différent du texte affiché. */
	accessibilityLabel?: string;
};

export function Button({
	label,
	onPress,
	variant = "primary",
	disabled,
	style,
	accessibilityLabel,
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Pressable
			disabled={disabled}
			onPress={() => {
				tapFeedback();
				onPress?.();
			}}
			style={({ pressed }) => [
				styles.base,
				styles[variant],
				disabled && styles.disabled,
				pressed && !disabled && styles.pressed,
				style,
			]}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel ?? label}
			accessibilityState={{ disabled: !!disabled }}
		>
			<Text
				style={[
					styles.label,
					(variant === "ghost" || variant === "secondary") && styles.neutralLabel,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				base: {
					paddingVertical: SPACING.md,
					paddingHorizontal: SPACING.lg,
					borderRadius: RADIUS.md,
					alignItems: "center",
					justifyContent: "center",
					...colors.decor.raised,
				},
				label: {
					color: colors.primaryText,
					fontSize: 16,
					fontWeight: "600",
					...displayFont(colors),
				},
				// Fonds neutres (transparent, surfaceAlt) : le blanc y serait illisible en thème clair.
				neutralLabel: {
					color: colors.text,
				},
				pressed: colors.decor.raisedPressed ?? { opacity: 0.75 },
				disabled: {
					opacity: 0.4,
				},
				primary: { backgroundColor: colors.primary },
				secondary: { backgroundColor: colors.surfaceAlt },
				success: { backgroundColor: colors.success },
				danger: { backgroundColor: colors.danger },
				ghost: { backgroundColor: "transparent", borderWidth: 1, borderColor: colors.border },
			}),
		[colors],
	);
}
