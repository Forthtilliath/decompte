import { ReorderList } from "@forthtilliath/react-native-kit/components/list/ReorderList";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
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

/** Réordonne les joueurs d'une partie avec des flèches monter / descendre (`ReorderList` du kit). */
export function PlayerOrderSheet({ visible, onClose, players, onMove }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<BottomSheet visible={visible} onClose={onClose} title="Ordre des joueurs">
			<ScrollView contentContainerStyle={styles.content}>
				<ReorderList
					items={players}
					keyExtractor={(player) => player.id}
					getLabel={(player) => player.name}
					onChange={(next, { from, to }) => {
						const moved = next[to];
						if (moved) onMove(moved.id, to > from ? 1 : -1);
					}}
					onMoveFeedback={selectFeedback}
					renderItem={(player) => (
						<View style={styles.player}>
							<PlayerAvatar
								name={player.name}
								avatarUri={player.avatarUri}
								seed={player.id}
								size={32}
							/>
							<Text style={styles.name} numberOfLines={1}>
								{player.name}
							</Text>
						</View>
					)}
					styles={{
						row: styles.row,
						position: styles.position,
						arrow: styles.arrow,
						arrowColor: colors.text,
					}}
				/>
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
					minHeight: 48,
					paddingHorizontal: SPACING.sm,
					borderRadius: RADIUS.md,
					backgroundColor: colors.surfaceAlt,
				},
				player: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				position: {
					width: 20,
					color: colors.textMuted,
				},
				name: {
					flex: 1,
					color: colors.text,
					fontSize: 15,
				},
				arrow: {
					width: 40,
					height: 40,
				},
			}),
		[colors],
	);
}
