import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { Player } from "@/types/player";

type Props = {
	visible: boolean;
	onClose: () => void;
	/** Joueurs dans l'ordre de jeu actuel. */
	players: Player[];
	/** Décale le joueur d'une place : -1 vers le haut, 1 vers le bas. */
	onMove: (playerId: string, offset: -1 | 1) => void;
};

/** Réordonne les joueurs d'une partie avec des flèches monter / descendre. */
export function PlayerOrderSheet({ visible, onClose, players, onMove }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const arrow = (player: Player, offset: -1 | 1, disabled: boolean) => (
		<Pressable
			style={[styles.arrow, disabled && styles.arrowDisabled]}
			disabled={disabled}
			hitSlop={4}
			onPress={() => {
				selectFeedback();
				onMove(player.id, offset);
			}}
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			accessibilityLabel={`${offset < 0 ? "Monter" : "Descendre"} ${player.name}`}
		>
			<Ionicons name={offset < 0 ? "chevron-up" : "chevron-down"} size={22} color={colors.text} />
		</Pressable>
	);

	return (
		<BottomSheet visible={visible} onClose={onClose} title="Ordre des joueurs">
			<ScrollView contentContainerStyle={styles.content}>
				{players.map((player, index) => (
					<View key={player.id} style={styles.row}>
						<Text style={styles.position}>{index + 1}</Text>
						<PlayerAvatar
							name={player.name}
							avatarUri={player.avatarUri}
							seed={player.id}
							size={32}
						/>
						<Text style={styles.name} numberOfLines={1}>
							{player.name}
						</Text>
						{arrow(player, -1, index === 0)}
						{arrow(player, 1, index === players.length - 1)}
					</View>
				))}
				<Button label="Terminé" variant="secondary" onPress={onClose} />
			</ScrollView>
		</BottomSheet>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.xs,
					paddingBottom: SPACING.md,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					minHeight: 48,
					paddingHorizontal: SPACING.sm,
					borderRadius: RADIUS.md,
					backgroundColor: colors.surfaceAlt,
				},
				position: {
					width: 20,
					color: colors.textMuted,
					fontWeight: "700",
					textAlign: "center",
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 15,
				},
				arrow: {
					width: 40,
					height: 40,
					alignItems: "center",
					justifyContent: "center",
				},
				arrowDisabled: {
					opacity: 0.25,
				},
			}),
		[colors],
	);
}
