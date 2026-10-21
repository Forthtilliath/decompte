import { findPageBackground, PAGE_BACKGROUNDS, resolveThemeColors } from "@/constants/backgrounds";
import { DARK_COLORS, LIGHT_COLORS } from "@/constants/theme";
import { contrastRatio as contrast } from "@/lib/contrast";

const ALL = (["dark", "light"] as const).flatMap((mode) =>
	PAGE_BACKGROUNDS[mode].map((background) => ({ mode, background })),
);

describe("fonds de page", () => {
	it("gardent le fond d'origine en premier, appliqué par défaut", () => {
		expect(resolveThemeColors("dark", undefined)).toEqual(DARK_COLORS);
		expect(resolveThemeColors("light", undefined)).toEqual(LIGHT_COLORS);
	});

	it("reviennent au fond d'origine pour un identifiant inconnu", () => {
		expect(findPageBackground("dark", "disparu").id).toBe("nuit");
		expect(findPageBackground("light", "nuit").id).toBe("carton");
	});

	it("ne remplacent que les neutres, pas les couleurs de pions", () => {
		const colors = resolveThemeColors("dark", "tapis");
		expect(colors.background).toBe("#0b1f15");
		expect(colors.primary).toBe(DARK_COLORS.primary);
		expect(colors.gold).toBe(DARK_COLORS.gold);
	});

	it("ont des identifiants uniques et des hex à 6 chiffres", () => {
		for (const mode of ["dark", "light"] as const) {
			const ids = PAGE_BACKGROUNDS[mode].map((b) => b.id);
			expect(new Set(ids).size).toBe(ids.length);
		}
		for (const { background } of ALL) {
			for (const value of Object.values(background.colors)) expect(value).toMatch(/^#[0-9a-f]{6}$/);
		}
	});

	it.each(ALL)("$mode / $background.label : textes lisibles (≥ 4,5)", ({ mode, background }) => {
		const colors = resolveThemeColors(mode, background.id);
		for (const surface of [colors.background, colors.surface, colors.surfaceAlt]) {
			expect(contrast(colors.text, surface)).toBeGreaterThanOrEqual(4.5);
			expect(contrast(colors.textMuted, surface)).toBeGreaterThanOrEqual(4.5);
		}
	});

	it.each(ALL)(
		"$mode / $background.label : icônes de pions visibles sur les cartes (≥ 3)",
		({ mode, background }) => {
			const colors = resolveThemeColors(mode, background.id);
			for (const tint of [
				colors.primary,
				colors.gold,
				colors.danger,
				colors.success,
				colors.purple,
			]) {
				expect(contrast(tint, colors.surface)).toBeGreaterThanOrEqual(3);
			}
		},
	);
});
