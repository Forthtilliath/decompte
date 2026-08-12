import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { Player } from "@/types/player";

type Props = {
	player: Player;
	onPress: () => void;
	onToggleFavorite: () => void;
	onToggleArchived: () => void;
};

export function PlayerListItem({ player, onPress, onToggleFavorite, onToggleArchived }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Pressable
			style={[styles.row, player.isArchived && styles.archivedRow]}
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={`Modifier ${player.name}`}
		>
			<PlayerAvatar name={player.name} avatarUri={player.avatarUri} seed={player.id} size={48} />
			<Text style={styles.name} numberOfLines={1}>
				{player.name}
			</Text>
			<Pressable
				hitSlop={8}
				onPress={onToggleFavorite}
				style={styles.iconButton}
				accessibilityRole="button"
				accessibilityLabel={player.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
				accessibilityState={{ selected: player.isFavorite }}
			>
				<Ionicons
					name={player.isFavorite ? "star" : "star-outline"}
					size={22}
					color={player.isFavorite ? colors.gold : colors.textMuted}
				/>
			</Pressable>
			<Pressable
				hitSlop={8}
				onPress={onToggleArchived}
				style={styles.iconButton}
				accessibilityRole="button"
				accessibilityLabel={player.isArchived ? "Désarchiver" : "Archiver"}
				accessibilityState={{ selected: player.isArchived }}
			>
				<Ionicons
					name={player.isArchived ? "archive" : "archive-outline"}
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
				},
				archivedRow: {
					opacity: 0.5,
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 16,
					fontWeight: "600",
				},
				iconButton: {
					padding: SPACING.xs,
				},
			}),
		[colors],
	);
}
