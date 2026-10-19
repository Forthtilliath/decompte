import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	rank: number;
	/** Avatar ou pastille affichée entre le rang et le titre. */
	leading?: ReactNode;
	title: string;
	meta: string;
	value: string;
	/** Rend la ligne cliquable (ex. choisir ce joueur ou ce jeu). */
	onPress?: () => void;
	selected?: boolean;
};

/** Ligne de classement : rang, titre, détail en petit et valeur mise en avant à droite. */
export function RankingRow({ rank, leading, title, meta, value, onPress, selected }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Pressable
			style={[styles.row, selected && styles.rowSelected]}
			onPress={onPress}
			disabled={!onPress}
			accessibilityRole={onPress ? "button" : undefined}
			accessibilityState={onPress ? { selected } : undefined}
			accessibilityLabel={`${rank}. ${title}, ${meta}, ${value}`}
		>
			<Text style={styles.rank}>{rank}</Text>
			{leading}
			<View style={styles.info}>
				<Text style={styles.title} numberOfLines={1}>
					{title}
				</Text>
				<Text style={styles.meta}>{meta}</Text>
			</View>
			<Text style={styles.value}>{value}</Text>
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
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.sm,
					borderWidth: 1.5,
					borderColor: "transparent",
				},
				rowSelected: {
					borderColor: colors.primary,
				},
				rank: {
					width: 20,
					textAlign: "center",
					color: colors.textMuted,
					fontWeight: "700",
				},
				info: {
					flex: 1,
				},
				title: {
					color: colors.text,
					fontWeight: "600",
				},
				meta: {
					color: colors.textMuted,
					fontSize: 12,
				},
				value: {
					color: colors.gold,
					fontSize: 16,
					fontWeight: "800",
				},
			}),
		[colors],
	);
}
