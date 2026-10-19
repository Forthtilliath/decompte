import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { BackgroundPicker } from "@/components/settings/BackgroundPicker";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { findPageBackground, PAGE_BACKGROUNDS } from "@/constants/backgrounds";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { type ThemeMode, useThemeStore } from "@/stores/themeStore";

export default function AppearanceSettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const mode = useThemeStore((s) => s.mode);
	const backgroundId = useThemeStore((s) => s.backgrounds[mode]);
	const setMode = useThemeStore((s) => s.setMode);
	const setBackground = useThemeStore((s) => s.setBackground);

	return (
		<ScreenContainer style={styles.container}>
			<Text style={styles.section}>Thème</Text>
			<RadioGroup<ThemeMode>
				options={[
					{ value: "dark", label: "Sombre" },
					{ value: "light", label: "Clair" },
				]}
				value={mode}
				onChange={setMode}
			/>

			<Text style={[styles.section, styles.spaced]}>Couleur de fond</Text>
			<BackgroundPicker
				options={PAGE_BACKGROUNDS[mode]}
				value={findPageBackground(mode, backgroundId).id}
				onChange={setBackground}
			/>
			<Text style={styles.hint}>
				Les thèmes sombre et clair gardent chacun leur propre couleur de fond.
			</Text>
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
				section: {
					color: colors.textMuted,
					fontSize: 13,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 0.5,
				},
				spaced: {
					marginTop: SPACING.md,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
