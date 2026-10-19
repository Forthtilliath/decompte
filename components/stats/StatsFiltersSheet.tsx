import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import type { ReactNode } from "react";
import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { GameDef } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	visible: boolean;
	onClose: () => void;
	/** Si fourni, propose de filtrer par jeu (`undefined` = tous les jeux). */
	games?: GameDef[];
	selectedGameId?: string;
	onSelectGame?: (id: string | undefined) => void;
	players: Player[];
	selectedPlayerId?: string;
	onSelectPlayer: (id: string) => void;
	playerSectionTitle?: string;
};

/** Choix du jeu et du joueur affichés dans les statistiques. */
export function StatsFiltersSheet({
	visible,
	onClose,
	games,
	selectedGameId,
	onSelectGame,
	players,
	selectedPlayerId,
	onSelectPlayer,
	playerSectionTitle = "Joueur",
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const option = (
		key: string,
		label: string,
		selected: boolean,
		onPress: () => void,
		leading?: ReactNode,
	) => (
		<Pressable
			key={key}
			style={[styles.option, selected && styles.optionSelected]}
			onPress={() => {
				selectFeedback();
				onPress();
			}}
			accessibilityRole="radio"
			accessibilityState={{ checked: selected }}
			accessibilityLabel={label}
		>
			{leading}
			<Text style={styles.optionLabel} numberOfLines={1}>
				{label}
			</Text>
			{selected && <Ionicons name="checkmark" size={20} color={colors.primary} />}
		</Pressable>
	);

	return (
		<BottomSheet visible={visible} onClose={onClose} title="Filtres">
			<ScrollView contentContainerStyle={styles.content}>
				{games && onSelectGame && (
					<>
						<SectionTitle>Jeu</SectionTitle>
						{option("all", "Tous les jeux", selectedGameId === undefined, () =>
							onSelectGame(undefined),
						)}
						{games.map((game) =>
							option(game.id, game.name, game.id === selectedGameId, () => onSelectGame(game.id)),
						)}
					</>
				)}

				<SectionTitle style={styles.sectionGap}>{playerSectionTitle}</SectionTitle>
				<View>
					{players.map((player) =>
						option(
							player.id,
							player.name,
							player.id === selectedPlayerId,
							() => {
								onSelectPlayer(player.id);
								onClose();
							},
							<PlayerAvatar
								name={player.name}
								avatarUri={player.avatarUri}
								seed={player.id}
								size={32}
							/>,
						),
					)}
				</View>
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
				sectionGap: {
					marginTop: SPACING.sm,
				},
				option: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					minHeight: 44,
					paddingHorizontal: SPACING.sm,
					paddingVertical: SPACING.xs,
					borderRadius: RADIUS.md,
				},
				optionSelected: {
					backgroundColor: colors.surfaceAlt,
				},
				optionLabel: {
					flex: 1,
					color: colors.text,
					fontSize: 15,
				},
			}),
		[colors],
	);
}
