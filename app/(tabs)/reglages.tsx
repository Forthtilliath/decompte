import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useThemeStore } from "@/stores/themeStore";

export default function SettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const mode = useThemeStore((s) => s.mode);
	const setMode = useThemeStore((s) => s.setMode);

	return (
		<ScreenContainer style={styles.container}>
			<Text style={styles.label}>Apparence</Text>
			<RadioGroup
				options={[
					{ value: "dark", label: "Sombre" },
					{ value: "light", label: "Clair" },
				]}
				value={mode}
				onChange={setMode}
			/>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.sm,
				},
				label: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
				},
			}),
		[colors],
	);
}
