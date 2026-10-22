import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { type StyleProp, StyleSheet, Text, type TextStyle } from "react-native";
import { displayFont, type ThemeColors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = PropsWithChildren<{ style?: StyleProp<TextStyle> }>;

/** Titre de section en petites capitales grisées, comme sur les écrans Joueurs et Jeux. */
export function SectionTitle({ children, style }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Text style={[styles.title, style]} accessibilityRole="header">
			{children}
		</Text>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				title: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
					...displayFont(colors),
				},
			}),
		[colors],
	);
}
