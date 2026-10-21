import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { type ColorValue, StyleSheet, Text } from "react-native";
import { TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

/**
 * Les couleurs d'onglet viennent de `tabBarActiveTintColor`/`tabBarInactiveTintColor`, toujours des
 * chaînes ici : `ColorValue` (RN 0.88) admet aussi un nombre, que Ionicons refuse.
 */
function tabIcon(name: ComponentProps<typeof Ionicons>["name"]) {
	return ({ color, size }: { color: ColorValue; size: number }) => (
		<Ionicons name={name} color={color as string} size={size} />
	);
}

/**
 * Libellé d'onglet au style par défaut de React Navigation, mais plafonné : cinq onglets se
 * partagent la largeur, et « Historique » serait tronqué avec une police système agrandie.
 */
function tabLabel(text?: string) {
	return ({ color, children }: { color: ColorValue; children: string }) => (
		<Text
			numberOfLines={1}
			maxFontSizeMultiplier={TIGHT_FONT_SCALE}
			style={[styles.tabLabel, { color }]}
		>
			{text ?? children}
		</Text>
	);
}

export default function TabsLayout() {
	const colors = useColors();

	// Chaque onglet actif a sa couleur : les 4 pions classiques (bleu, rouge, vert, jaune), plus violet pour Stats.
	return (
		<Tabs
			screenOptions={{
				headerStyle: { backgroundColor: colors.surface },
				headerTintColor: colors.text,
				headerTitleStyle: { color: colors.text },
				tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
				tabBarActiveTintColor: colors.primary,
				tabBarInactiveTintColor: colors.textMuted,
				tabBarLabel: tabLabel(),
			}}
		>
			<Tabs.Screen name="index" options={{ href: null, headerShown: false }} />
			<Tabs.Screen
				name="jeux"
				options={{
					title: "Jeux",
					headerShown: false,
					tabBarIcon: tabIcon("game-controller"),
				}}
			/>
			<Tabs.Screen
				name="joueurs"
				options={{
					title: "Joueurs",
					tabBarIcon: tabIcon("people"),
					tabBarActiveTintColor: colors.danger,
				}}
			/>
			<Tabs.Screen
				name="historique"
				options={{
					title: "Historique",
					tabBarIcon: tabIcon("time"),
					tabBarActiveTintColor: colors.success,
				}}
			/>
			<Tabs.Screen
				name="stats"
				options={{
					title: "Statistiques",
					tabBarLabel: tabLabel("Stats"),
					tabBarIcon: tabIcon("stats-chart"),
					tabBarActiveTintColor: colors.purple,
				}}
			/>
			<Tabs.Screen
				name="reglages"
				options={{
					title: "Réglages",
					headerShown: false,
					tabBarIcon: tabIcon("settings"),
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
});
