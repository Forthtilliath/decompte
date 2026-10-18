import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/stores/themeStore";

export default function RootLayout() {
	const colors = useColors();
	const mode = useThemeStore((s) => s.mode);

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<SafeAreaProvider>
				<StatusBar style={mode === "light" ? "dark" : "light"} />
				<Stack
					screenOptions={{
						headerStyle: { backgroundColor: colors.surface },
						headerTintColor: colors.text,
						headerTitleStyle: { color: colors.text },
						contentStyle: { backgroundColor: colors.background },
					}}
				>
					<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
					<Stack.Screen
						name="players/new"
						options={{ title: "Nouveau joueur", presentation: "modal" }}
					/>
					<Stack.Screen
						name="players/[id]"
						options={{ title: "Modifier le joueur", presentation: "modal" }}
					/>
					<Stack.Screen
						name="groups/new"
						options={{ title: "Nouveau groupe", presentation: "modal" }}
					/>
					<Stack.Screen
						name="groups/[id]"
						options={{ title: "Modifier le groupe", presentation: "modal" }}
					/>
					<Stack.Screen name="history/[id]" options={{ title: "Détail de la partie" }} />
				</Stack>
			</SafeAreaProvider>
		</GestureHandlerRootView>
	);
}
