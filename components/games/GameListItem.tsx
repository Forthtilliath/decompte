import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { getAvatarColor } from "@/lib/avatarColor";
import { readableTextOn } from "@/lib/contrast";
import { plural } from "@/lib/plural";
import { getRoundCount } from "@/lib/rounds";
import type { GameDef } from "@/types/game";

type Props = {
	game: GameDef;
	onPress: () => void;
};

/**
 * Ligne de la liste des jeux : pastille à l'initiale (couleur stable, tirée de l'id comme les
 * avatars des joueurs) et bande des couleurs de ses catégories, pour repérer un jeu d'un coup d'œil.
 */
export function GameListItem({ game, onPress }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const avatarColor = getAvatarColor(game.id);
	const roundCount = getRoundCount(game);
	const meta = `${game.categories.length} ${plural(game.categories.length, "catégorie")}${
		roundCount > 1 ? ` · ${roundCount} manches` : ""
	}`;

	return (
		<Pressable
			style={({ pressed }) => [styles.row, pressed && styles.pressed]}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`${game.name}, ${meta}`}
		>
			<View style={[styles.avatar, { backgroundColor: avatarColor }]}>
				<Text
					style={[styles.initial, { color: readableTextOn(avatarColor) }]}
					allowFontScaling={false}
				>
					{game.name.trim().charAt(0).toUpperCase() || "?"}
				</Text>
			</View>
			<View style={styles.textWrap}>
				<Text style={styles.label} numberOfLines={1}>
					{game.name}
				</Text>
				<Text style={styles.value} numberOfLines={1}>
					{meta}
				</Text>
				<View style={styles.band}>
					{game.categories.map((category) => (
						<View key={category.id} style={[styles.segment, { backgroundColor: category.color }]} />
					))}
				</View>
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
				avatar: {
					width: 40,
					height: 40,
					borderRadius: RADIUS.sm,
					alignItems: "center",
					justifyContent: "center",
				},
				initial: {
					fontSize: 20,
					fontWeight: "800",
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
				value: {
					color: colors.textMuted,
					fontSize: 13,
				},
				band: {
					flexDirection: "row",
					gap: 2,
					height: 4,
					marginTop: SPACING.xs,
					maxWidth: 160,
				},
				segment: {
					flex: 1,
					borderRadius: RADIUS.full,
				},
			}),
		[colors],
	);
}
