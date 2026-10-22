import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { PlayerGroup } from "@/types/player";

type Props = {
	group: PlayerGroup;
	onPress: () => void;
	onToggleFavorite: () => void;
	onToggleArchived: () => void;
};

export function GroupListItem({ group, onPress, onToggleFavorite, onToggleArchived }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Pressable
			style={[styles.row, group.isArchived && styles.archivedRow]}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`Modifier le groupe ${group.name}`}
		>
			<View style={styles.icon}>
				<Ionicons name="people" size={22} color={colors.primaryText} />
			</View>
			<View style={styles.info}>
				<Text style={styles.name} numberOfLines={1}>
					{group.name}
				</Text>
				<Text style={styles.meta}>
					{group.playerIds.length} joueur{group.playerIds.length > 1 ? "s" : ""}
				</Text>
			</View>
			<Pressable
				hitSlop={8}
				onPress={onToggleFavorite}
				style={styles.iconButton}
				accessibilityRole="button"
				accessibilityLabel={group.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
				accessibilityState={{ selected: group.isFavorite }}
			>
				<Ionicons
					name={group.isFavorite ? "star" : "star-outline"}
					size={22}
					color={group.isFavorite ? colors.gold : colors.textMuted}
				/>
			</Pressable>
			<Pressable
				hitSlop={8}
				onPress={onToggleArchived}
				style={styles.iconButton}
				accessibilityRole="button"
				accessibilityLabel={group.isArchived ? "Désarchiver" : "Archiver"}
				accessibilityState={{ selected: group.isArchived }}
			>
				<Ionicons
					name={group.isArchived ? "archive" : "archive-outline"}
					size={20}
					color={colors.textMuted}
				/>
			</Pressable>
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
					padding: SPACING.sm,
					...colors.decor.card,
				},
				archivedRow: {
					opacity: 0.5,
				},
				icon: {
					width: 48,
					height: 48,
					borderRadius: 24,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
				info: {
					flex: 1,
					gap: 2,
				},
				name: {
					color: colors.text,
					fontSize: 16,
					fontWeight: "600",
				},
				meta: {
					color: colors.textMuted,
					fontSize: 12,
				},
				iconButton: {
					padding: SPACING.xs,
				},
			}),
		[colors],
	);
}
