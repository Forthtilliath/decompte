import { Ionicons } from "@expo/vector-icons";
import { readableTextOn } from "@forthtilliath/ts-kit/color/contrastRatio";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { type ColorValue, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { displayFont, type ThemeColors, TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { headerOptions } from "@/hooks/useStackScreenOptions";

/** Hauteur de la barre native des Stacks sous Android (`?attr/actionBarSize`), hors barre d'état. */
const NATIVE_HEADER_HEIGHT = 56;

/**
 * Les couleurs d'onglet viennent de `tabBarActiveTintColor`/`tabBarInactiveTintColor`, toujours des
 * chaînes ici : `ColorValue` (RN 0.88) admet aussi un nombre, que Ionicons refuse. Avec le thème
 * Ludique, l'icône de l'onglet actif est posée sur un pion de sa couleur.
 */
function tabIcon(name: ComponentProps<typeof Ionicons>["name"], colors: ThemeColors) {
	return ({ color, size, focused }: { color: ColorValue; size: number; focused: boolean }) =>
		colors.decor.tabTokens && focused ? (
			<View style={[styles.token, { backgroundColor: color, borderColor: colors.text }]}>
				<Ionicons name={name} color={readableTextOn(color as string)} size={size - 6} />
			</View>
		) : (
			<Ionicons name={name} color={color as string} size={size} />
		);
}

/**
 * Libellé d'onglet au style par défaut de React Navigation, mais plafonné : cinq onglets se
 * partagent la largeur, et « Historique » serait tronqué avec une police système agrandie.
 */
function tabLabel(colors: ThemeColors, text?: string) {
	const font = displayFont(colors);
	return ({ color, children }: { color: ColorValue; children: string }) => (
		<Text
			numberOfLines={1}
			maxFontSizeMultiplier={TIGHT_FONT_SCALE}
			style={[styles.tabLabel, font, { color }]}
		>
			{text ?? children}
		</Text>
	);
}

export default function TabsLayout() {
	const colors = useColors();
	const insets = useSafeAreaInsets();
	const header = headerOptions(colors);

	// Chaque onglet actif a sa couleur : les 4 pions classiques (bleu, rouge, vert, jaune), plus violet pour Stats.
	return (
		<Tabs
			screenOptions={{
				// L'en-tête JS des onglets fait 64 dp sous Android, la barre native des Stacks 56 dp
				// (actionBarSize) : on l'aligne pour que tous les en-têtes aient la même hauteur.
				...header,
				headerStyle: { ...header.headerStyle, height: NATIVE_HEADER_HEIGHT + insets.top },
				tabBarStyle: {
					backgroundColor: colors.surface,
					borderTopColor: colors.border,
					...colors.decor.tabBar,
				},
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarLabel: tabLabel(colors),
			}}
		>
			<Tabs.Screen name="index" options={{ href: null, headerShown: false }} />
			<Tabs.Screen
				name="jeux"
				options={{
					title: "Jeux",
					headerShown: false,
					tabBarIcon: tabIcon("game-controller", colors),
				}}
			/>
			<Tabs.Screen
				name="joueurs"
				options={{
					title: "Joueurs",
					tabBarIcon: tabIcon("people", colors),
					tabBarActiveTintColor: colors.danger,
				}}
			/>
			<Tabs.Screen
				name="historique"
				options={{
					title: "Historique",
					tabBarIcon: tabIcon("time", colors),
					tabBarActiveTintColor: colors.success,
				}}
			/>
			<Tabs.Screen
				name="stats"
				options={{
					title: "Statistiques",
					tabBarLabel: tabLabel(colors, "Stats"),
					tabBarIcon: tabIcon("stats-chart", colors),
					tabBarActiveTintColor: colors.purple,
				}}
			/>
			<Tabs.Screen
				name="reglages"
				options={{
					title: "Réglages",
					headerShown: false,
					tabBarIcon: tabIcon("settings", colors),
					tabBarActiveTintColor: colors.gold,
				}}
			/>
		</Tabs>
	);
}

const styles = StyleSheet.create({
	// Taille et graisse du libellé sous l'icône par défaut (React Navigation).
	tabLabel: {
		fontSize: 10,
		fontWeight: "500",
		textAlign: "center",
		backgroundColor: "transparent",
	},
	// Pion sous l'icône active du thème Ludique, un peu plus grand que l'icône seule.
	token: {
		width: 30,
		height: 30,
		borderRadius: 15,
		borderWidth: 2,
		alignItems: "center",
		justifyContent: "center",
	},
});
