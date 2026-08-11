import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { Player } from "@/types/player";

type Props = PropsWithChildren<{
	player: Player;
	points?: number;
}>;

export function PlayerScoreRow({ player, points, children }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<PlayerAvatar name={player.name} avatarUri={player.avatarUri} seed={player.id} size={40} />
				<Text style={styles.name} numberOfLines={1}>
					{player.name}
				</Text>
				{points !== undefined && (
					<View style={styles.badge}>
						<Text style={styles.badgeText}>{points} pts</Text>
					</View>
				)}
			</View>
			<View style={styles.content}>{children}</View>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.sm,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 16,
					fontWeight: "700",
				},
				badge: {
					backgroundColor: colors.surfaceAlt,
					borderRadius: RADIUS.full,
					paddingHorizontal: SPACING.sm,
					paddingVertical: 4,
				},
				badgeText: {
					color: colors.gold,
					fontWeight: "700",
					fontSize: 13,
				},
				content: {
					gap: SPACING.sm,
				},
			}),
		[colors],
	);
}
