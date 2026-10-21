import {
	type BackgroundOption,
	findBackground,
} from "@forthtilliath/react-native-kit/components/theme/findBackground";
import { DARK_COLORS, LIGHT_COLORS, type ThemeColors } from "@/constants/theme";
import type { ThemeMode } from "@/stores/themeStore";

/** Teintes neutres qu'un fond remplace : page, cartes, champs, bordures et texte secondaire. */
export type BackgroundColors = Pick<
	ThemeColors,
	"background" | "surface" | "surfaceAlt" | "border" | "textMuted"
>;

/** Pastille du `BackgroundPicker` de react-native-kit, avec la palette complète du fond. */
export type PageBackground = BackgroundOption & { colors: BackgroundColors };

function pageBackground(id: string, label: string, colors: BackgroundColors): PageBackground {
	return {
		id,
		label,
		colors,
		page: colors.background,
		card: colors.surface,
		cardBorder: colors.border,
	};
}

function neutralsOf(colors: ThemeColors): BackgroundColors {
	const { background, surface, surfaceAlt, border, textMuted } = colors;
	return { background, surface, surfaceAlt, border, textMuted };
}

// Mêmes règles que les palettes de base (contrastes vérifiés par backgrounds.test.ts) : texte et
// texte secondaire ≥ 4,5 sur page/cartes/champs, pions colorés en icône sur `surface` ≥ 3.
// Le premier fond de chaque mode est celui d'origine, appliqué par défaut.
export const PAGE_BACKGROUNDS: Record<ThemeMode, readonly PageBackground[]> = {
	dark: [
		pageBackground("nuit", "Bleu nuit", neutralsOf(DARK_COLORS)),
		pageBackground("tapis", "Tapis vert", {
			background: "#0b1f15",
			surface: "#112c1e",
			surfaceAlt: "#1c3f2c",
			border: "#315c45",
			textMuted: "#9bb8a6",
		}),
		pageBackground("acajou", "Acajou", {
			background: "#22140f",
			surface: "#321f18",
			surfaceAlt: "#462c22",
			border: "#664437",
			textMuted: "#c0a597",
		}),
		pageBackground("ardoise", "Ardoise", {
			background: "#121417",
			surface: "#1d2024",
			surfaceAlt: "#2a2e34",
			border: "#424850",
			textMuted: "#a2a9b2",
		}),
	],
	light: [
		pageBackground("carton", "Carton", neutralsOf(LIGHT_COLORS)),
		pageBackground("blanc", "Blanc", {
			background: "#eceff4",
			surface: "#ffffff",
			surfaceAlt: "#dfe4ec",
			border: "#c3ccd9",
			textMuted: "#56606e",
		}),
		pageBackground("sauge", "Sauge", {
			background: "#e2ece3",
			surface: "#f7fbf7",
			surfaceAlt: "#d3e3d5",
			border: "#b0cab4",
			textMuted: "#4f6354",
		}),
		pageBackground("poudre", "Rose poudré", {
			background: "#f3e4e7",
			surface: "#fffafb",
			surfaceAlt: "#ead4d9",
			border: "#d3b2ba",
			textMuted: "#6c5359",
		}),
	],
};

/** Fond choisi pour ce mode, ou celui d'origine si l'identifiant est inconnu (fond retiré…). */
export function findPageBackground(mode: ThemeMode, id: string | undefined): PageBackground {
	return findBackground(PAGE_BACKGROUNDS[mode], id);
}

/** Palette complète : couleurs de pions du mode, neutres du fond choisi. */
export function resolveThemeColors(mode: ThemeMode, backgroundId: string | undefined): ThemeColors {
	const base = mode === "light" ? LIGHT_COLORS : DARK_COLORS;
	return { ...base, ...findPageBackground(mode, backgroundId).colors };
}
