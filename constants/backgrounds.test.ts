import { findPageBackground, PAGE_BACKGROUNDS, resolveThemeColors } from "@/constants/backgrounds";
import { DARK_COLORS, LIGHT_COLORS } from "@/constants/theme";

/** Rapport de contraste WCAG 2 entre deux couleurs hex à 6 chiffres. */
function contrast(a: string, b: string): number {
	const luminance = (hex: string) => {
		const [r, g, bl] = [1, 3, 5].map((i) => {
			const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
			return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
		});
		return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
	};
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

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
			for (const tint of [colors.primary, colors.gold, colors.danger, colors.success]) {
				expect(contrast(tint, colors.surface)).toBeGreaterThanOrEqual(3);
			}
		},
	);
});
