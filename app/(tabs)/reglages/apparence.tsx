import {
	BackgroundPicker,
	type BackgroundPickerStyles,
} from "@forthtilliath/react-native-kit/components/theme/BackgroundPicker";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { findPageBackground, PAGE_BACKGROUNDS } from "@/constants/backgrounds";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { THEME_LABELS, THEME_MODES, type ThemeMode, useThemeStore } from "@/stores/themeStore";

const THEME_OPTIONS = THEME_MODES.map((value) => ({
	value,
	label: THEME_LABELS[value],
}));

export default function AppearanceSettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const pickerStyles = useBackgroundPickerStyles(colors);
	const mode = useThemeStore((s) => s.mode);
	const backgroundId = useThemeStore((s) => s.backgrounds[mode]);
	const setMode = useThemeStore((s) => s.setMode);
	const setBackground = useThemeStore((s) => s.setBackground);

	return (
		<ScreenContainer style={styles.container}>
			<Text style={styles.section}>Thème</Text>
			<RadioGroup<ThemeMode> options={THEME_OPTIONS} value={mode} onChange={setMode} />

			<Text style={[styles.section, styles.spaced]}>Couleur de fond</Text>
			<BackgroundPicker
				options={PAGE_BACKGROUNDS[mode]}
				value={findPageBackground(mode, backgroundId).id}
				onChange={(option) => {
					selectFeedback();
					setBackground(option.id);
				}}
				styles={pickerStyles}
			/>
			<Text style={styles.hint}>Chaque thème garde sa propre couleur de fond.</Text>
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

/** Pastilles de fond (page + carte en aperçu, coche sur la sélection) aux couleurs du thème. */
function useBackgroundPickerStyles(colors: ThemeColors): BackgroundPickerStyles {
	return useMemo(
		() => ({
			row: { gap: SPACING.sm },
			option: { gap: SPACING.xs },
			swatch: { borderRadius: RADIUS.md, borderColor: colors.border, padding: SPACING.sm },
			swatchSelected: { borderColor: colors.primary },
			card: { borderRadius: RADIUS.sm },
			check: { top: SPACING.xs, right: SPACING.xs, backgroundColor: colors.primary },
			checkIconColor: colors.primaryText,
			label: { color: colors.textMuted },
			labelSelected: { color: colors.text },
		}),
		[colors],
	);
}
