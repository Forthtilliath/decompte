import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatAverage, type PlayerStats } from "@/lib/stats";
import type { CategoryDef } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	players: Player[];
	categories: CategoryDef[];
	statsByPlayerId: Record<string, PlayerStats>;
};

const LABEL_WIDTH = 110;
const PLAYER_WIDTH = 76;

/** Tableau croisé joueurs × catégories : points moyens de chaque joueur dans chaque catégorie. */
export function ScoreTable({ players, categories, statsByPlayerId }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<ScrollView horizontal showsHorizontalScrollIndicator>
			<View>
				<View style={styles.row}>
					<View style={[styles.cell, styles.labelCell]} />
					{players.map((player) => (
						<View key={player.id} style={[styles.cell, styles.playerCell]}>
							<PlayerAvatar
								name={player.name}
								avatarUri={player.avatarUri}
								seed={player.id}
								size={28}
							/>
							<Text style={styles.playerName} numberOfLines={1}>
								{player.name}
							</Text>
						</View>
					))}
				</View>

				<View style={[styles.row, styles.totalRow]}>
					<View style={[styles.cell, styles.labelCell]}>
						<Text style={styles.labelTextBold}>Total</Text>
					</View>
					{players.map((player) => (
						<View key={player.id} style={[styles.cell, styles.playerCell]}>
							<Text style={styles.valueTextBold}>
								{formatAverage(statsByPlayerId[player.id]?.averageTotal ?? 0)}
							</Text>
						</View>
					))}
				</View>

				{categories.map((category) => (
					<View key={category.id} style={styles.row}>
						<View style={[styles.cell, styles.labelCell]}>
							<View style={[styles.dot, { backgroundColor: category.color }]} />
							<Text style={styles.labelText} numberOfLines={1}>
								{category.label}
							</Text>
						</View>
						{players.map((player) => (
							<View key={player.id} style={[styles.cell, styles.playerCell]}>
								<Text style={styles.valueText}>
									{formatAverage(statsByPlayerId[player.id]?.averageByCategory[category.id] ?? 0)}
								</Text>
							</View>
						))}
					</View>
				))}
			</View>
		</ScrollView>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				row: {
					flexDirection: "row",
					borderBottomWidth: 1,
					borderBottomColor: colors.border,
				},
				totalRow: {
					backgroundColor: colors.surface,
				},
				cell: {
					alignItems: "center",
					justifyContent: "center",
					paddingVertical: SPACING.sm,
				},
				labelCell: {
					width: LABEL_WIDTH,
					flexDirection: "row",
					justifyContent: "flex-start",
					gap: 6,
					paddingLeft: SPACING.xs,
				},
				playerCell: {
					width: PLAYER_WIDTH,
					gap: 4,
				},
				playerName: {
					color: colors.text,
					fontSize: 11,
					maxWidth: PLAYER_WIDTH - 8,
				},
				dot: {
					width: 10,
					height: 10,
					borderRadius: RADIUS.full,
				},
				labelText: {
					color: colors.textMuted,
					fontSize: 12,
					flexShrink: 1,
				},
				labelTextBold: {
					color: colors.text,
					fontSize: 12,
					fontWeight: "700",
				},
				valueText: {
					color: colors.text,
					fontSize: 13,
				},
				valueTextBold: {
					color: colors.gold,
					fontSize: 15,
					fontWeight: "700",
				},
			}),
		[colors],
	);
}
