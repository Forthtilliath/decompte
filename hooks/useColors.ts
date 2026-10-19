import { useMemo } from "react";
import { resolveThemeColors } from "@/constants/backgrounds";
import type { ThemeColors } from "@/constants/theme";
import { useThemeStore } from "@/stores/themeStore";

/** Palette de couleurs courante, réactive au mode et au fond choisis dans Réglages. */
export function useColors(): ThemeColors {
	const mode = useThemeStore((s) => s.mode);
	const backgroundId = useThemeStore((s) => s.backgrounds[mode]);
	// Mémoïsée : les écrans recalculent leurs styles quand cette référence change.
	return useMemo(() => resolveThemeColors(mode, backgroundId), [mode, backgroundId]);
}
