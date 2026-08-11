import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from "@/constants/theme";
import { useThemeStore } from "@/stores/themeStore";

/** Palette de couleurs courante, réactive au mode clair/sombre choisi dans Réglages. */
export function useColors(): ThemeColors {
	const mode = useThemeStore((s) => s.mode);
	return mode === "light" ? LIGHT_COLORS : DARK_COLORS;
}
