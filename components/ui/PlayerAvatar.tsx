import { readableTextOn } from "@forthtilliath/ts-kit/color/contrastRatio";
import { Image } from "expo-image";
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { getAvatarColor } from "@/lib/avatarColor";

type Props = {
	name: string;
	avatarUri?: string;
	size?: number;
	/** Identifiant stable pour dériver la couleur de fond (l'id du joueur, idéalement). Par défaut
	 * le nom, utilisé par exemple sur le formulaire de création où le joueur n'a pas encore d'id. */
	seed?: string;
};

// Décoratif : le nom du joueur est toujours écrit à côté, ou dans le libellé du bouton qui contient
// l'avatar. Sans ça, le lecteur d'écran lirait les initiales (« AL ») en plus du nom.
const HIDDEN_FROM_SCREEN_READER = {
	accessibilityElementsHidden: true,
	importantForAccessibility: "no-hide-descendants",
} as const;

export function PlayerAvatar({ name, avatarUri, size = 56, seed }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const initials = getInitials(name);
	const dimension = { width: size, height: size, borderRadius: size / 2 };

	if (avatarUri) {
		return (
			<Image
				source={{ uri: avatarUri }}
				style={[styles.image, dimension]}
				contentFit="cover"
				{...HIDDEN_FROM_SCREEN_READER}
			/>
		);
	}

	const backgroundColor = getAvatarColor(seed || name);

	return (
		<View
			style={[styles.placeholder, dimension, { backgroundColor }]}
			{...HIDDEN_FROM_SCREEN_READER}
		>
			<Text
				style={[styles.initials, { fontSize: size * 0.36, color: readableTextOn(backgroundColor) }]}
				// Les initiales remplissent un cercle de taille fixe : agrandies, elles en débordent.
				allowFontScaling={false}
			>
				{initials}
			</Text>
		</View>
	);
}

export function getInitials(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
	return (parts[0][0] + parts[1][0]).toUpperCase();
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				image: {
					backgroundColor: colors.surfaceAlt,
				},
				placeholder: {
					backgroundColor: colors.surfaceAlt,
					alignItems: "center",
					justifyContent: "center",
				},
				initials: {
					fontWeight: "700",
				},
			}),
		[colors],
	);
}
