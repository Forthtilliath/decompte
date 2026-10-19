import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import type { ComponentProps } from "react";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/lib/date";
import type { GlobalRecords } from "@/lib/stats";
import type { GameDef } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	records: GlobalRecords;
	players: Player[];
	games: GameDef[];
	/** Tous jeux confondus, les scores ne se comparent pas : le meilleur score n'est pas affiché. */
	singleGame: boolean;
};

/** Records de l'historique filtré ; ceux liés à une partie ouvrent son détail. */
export function RecordsSection({ records, players, games, singleGame }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const playerName = (id: string) => players.find((p) => p.id === id)?.name;
	const gameName = (id: string) => games.find((g) => g.id === id)?.name ?? "Jeu inconnu";

	const best = singleGame ? records.bestScore : null;
	const bestName = best && playerName(best.playerId);
	const streak = records.longestWinStreak;
	const streakName = streak && playerName(streak.playerId);
	const closest = records.closestGame;

	if (!bestName && !streakName && !closest) return null;

	return (
		<View style={styles.container}>
			<SectionTitle>Records</SectionTitle>
			<View style={styles.row}>
				{best && bestName && (
					<RecordCard
						icon="trophy"
						value={`${best.total} pts`}
						label="Meilleur score"
						detail={bestName}
						sessionId={best.sessionId}
						styles={styles}
						colors={colors}
					/>
				)}
				{streak && streakName && (
					<RecordCard
						icon="flame"
						value={String(streak.streak)}
						label="Plus longue série"
						detail={streakName}
						styles={styles}
						colors={colors}
					/>
				)}
				{closest && (
					<RecordCard
						icon="flash"
						value={`${closest.gap} pt${closest.gap > 1 ? "s" : ""}`}
						label="Partie la plus serrée"
						detail={singleGame ? formatDate(closest.playedAt) : gameName(closest.gameDefId)}
						sessionId={closest.sessionId}
						styles={styles}
						colors={colors}
					/>
				)}
			</View>
		</View>
	);
}

function RecordCard({
	icon,
	value,
	label,
	detail,
	sessionId,
	styles,
	colors,
}: {
	icon: ComponentProps<typeof Ionicons>["name"];
	value: string;
	label: string;
	detail: string;
	sessionId?: string;
	styles: ReturnType<typeof useStyles>;
	colors: ThemeColors;
}) {
	return (
		<Pressable
			style={styles.card}
			disabled={!sessionId}
			onPress={() => router.push(`/history/${sessionId}`)}
			accessibilityRole={sessionId ? "button" : undefined}
			accessibilityLabel={`${label} : ${value}, ${detail}`}
		>
			<Ionicons name={icon} size={20} color={colors.gold} />
			<Text style={styles.value}>{value}</Text>
			<Text style={styles.label}>{label}</Text>
			<Text style={styles.detail} numberOfLines={1}>
				{detail}
			</Text>
		</Pressable>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.sm,
				},
				row: {
					flexDirection: "row",
					gap: SPACING.sm,
				},
				card: {
					flex: 1,
					minWidth: 90,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					paddingVertical: SPACING.md,
					paddingHorizontal: SPACING.xs,
					alignItems: "center",
					gap: 2,
				},
				value: {
					color: colors.text,
					fontSize: 18,
					fontWeight: "800",
					marginTop: 4,
				},
				label: {
					color: colors.textMuted,
					fontSize: 11,
					textAlign: "center",
				},
				detail: {
					color: colors.gold,
					fontSize: 12,
					fontWeight: "700",
					textAlign: "center",
					maxWidth: "100%",
				},
			}),
		[colors],
	);
}
