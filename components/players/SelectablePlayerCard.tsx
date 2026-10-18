import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	playerId: string;
	name: string;
	avatarUri?: string;
	isFavorite?: boolean;
	selected: boolean;
	onPress: () => void;
};

export function SelectablePlayerCard({
	playerId,
	name,
	avatarUri,
	isFavorite,
	selected,
	onPress,
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Pressable
			style={[styles.card, selected && styles.cardSelected]}
			onPress={() => {
				selectFeedback();
				onPress();
			}}
			accessibilityRole="checkbox"
			accessibilityState={{ checked: selected }}
			accessibilityLabel={isFavorite ? `${name}, favori` : name}
		>
			<View style={styles.avatarWrapper}>
				<PlayerAvatar name={name} avatarUri={avatarUri} seed={playerId} size={56} />
				{isFavorite && (
					<View style={styles.favoriteBadge}>
						<Ionicons name="star" size={11} color="#fff" />
					</View>
				)}
			</View>
			<Text style={styles.name} numberOfLines={1}>
				{name}
			</Text>
		</Pressable>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					width: 84,
					alignItems: "center",
					gap: SPACING.xs,
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					borderWidth: 2,
					borderColor: "transparent",
					paddingVertical: SPACING.sm,
				},
				cardSelected: {
					borderColor: colors.primary,
				},
				avatarWrapper: {
					width: 56,
					height: 56,
				},
				favoriteBadge: {
					position: "absolute",
					top: -4,
					right: -4,
					width: 20,
					height: 20,
					borderRadius: 10,
					backgroundColor: colors.gold,
					alignItems: "center",
					justifyContent: "center",
					borderWidth: 2,
					borderColor: colors.surface,
				},
				name: {
					color: colors.text,
					fontSize: 13,
					maxWidth: 80,
				},
			}),
		[colors],
	);
}
