import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import type { ColorValue } from "react-native";
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
					tabBarLabel: "Stats",
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
