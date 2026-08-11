import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	icon: keyof typeof Ionicons.glyphMap;
	label: string;
	/** Aperçu de la valeur actuelle affiché sous le libellé (ex. "Sombre", "Meneurs, Cités"). */
	value?: string;
	onPress: () => void;
	/** Teinte rouge pour une entrée sensible (ex. "Zone dangereuse"). */
	danger?: boolean;
};

/** Ligne de menu navigable pour l'écran Réglages : icône + libellé + aperçu + chevron. */
export function SettingsRow({ icon, label, value, onPress, danger }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Pressable
			style={({ pressed }) => [styles.row, pressed && styles.pressed]}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={value ? `${label}, ${value}` : label}
		>
			<View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
				<Ionicons name={icon} size={20} color={danger ? colors.danger : colors.primary} />
			</View>
			<View style={styles.textWrap}>
				<Text style={[styles.label, danger && styles.labelDanger]}>{label}</Text>
				{value && (
					<Text style={styles.value} numberOfLines={1}>
						{value}
					</Text>
				)}
			</View>
			<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
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
					gap: SPACING.md,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
				},
				pressed: {
					opacity: 0.75,
				},
				iconWrap: {
					width: 36,
					height: 36,
					borderRadius: RADIUS.full,
					backgroundColor: colors.surfaceAlt,
					alignItems: "center",
					justifyContent: "center",
				},
				iconWrapDanger: {
					backgroundColor: `${colors.danger}22`,
				},
				textWrap: {
					flex: 1,
					gap: 2,
				},
				label: {
					color: colors.text,
					fontSize: 16,
					fontWeight: "600",
				},
				labelDanger: {
					color: colors.danger,
				},
				value: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
