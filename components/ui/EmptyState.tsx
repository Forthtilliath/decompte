import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	icon: keyof typeof Ionicons.glyphMap;
	message: string;
	/** Bouton qui mène directement à ce qui remplira la liste (« Créer un joueur »). */
	action?: { label: string; onPress: () => void };
};

/** Liste vide : une icône, l'explication et, si possible, l'action qui permet d'en sortir. */
export function EmptyState({ icon, message, action }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.container}>
			<View style={styles.iconWrap} accessibilityElementsHidden importantForAccessibility="no">
				<Ionicons name={icon} size={36} color={colors.textMuted} />
			</View>
			<Text style={styles.message}>{message}</Text>
			{action && <Button label={action.label} onPress={action.onPress} style={styles.action} />}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					alignItems: "center",
					gap: SPACING.md,
					paddingVertical: SPACING.xl,
					paddingHorizontal: SPACING.md,
				},
				iconWrap: {
					width: 72,
					height: 72,
					borderRadius: RADIUS.full,
					backgroundColor: colors.surfaceAlt,
					alignItems: "center",
					justifyContent: "center",
				},
				message: {
					color: colors.textMuted,
					textAlign: "center",
				},
				action: {
					alignSelf: "stretch",
				},
			}),
		[colors],
	);
}
