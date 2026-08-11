import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColors } from "@/hooks/useColors";

export default function TabsLayout() {
	const colors = useColors();

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
			<Tabs.Screen
				name="jeux"
				options={{
					title: "Jeux",
					headerShown: false,
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="game-controller" color={color} size={size} />
					),
				}}
			/>
			<Tabs.Screen
				name="joueurs"
				options={{
					title: "Joueurs",
					tabBarIcon: ({ color, size }) => <Ionicons name="people" color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="historique"
				options={{
					title: "Historique",
					tabBarIcon: ({ color, size }) => <Ionicons name="time" color={color} size={size} />,
				}}
			/>
			<Tabs.Screen
				name="reglages"
				options={{
					title: "Réglages",
					tabBarIcon: ({ color, size }) => <Ionicons name="settings" color={color} size={size} />,
				}}
			/>
		</Tabs>
	);
}
