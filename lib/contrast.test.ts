import {
	contrastRatio,
	readableTextOn,
	TEXT_CONTRAST,
} from "@forthtilliath/ts-kit/color/contrastRatio";
import { PAGE_BACKGROUNDS, resolveThemeColors } from "@/constants/backgrounds";
import { AVATAR_PALETTE } from "@/lib/avatarColor";
import { chipColors, readableTint } from "@/lib/contrast";
import { THEME_MODES } from "@/stores/themeStore";

const THEMES = THEME_MODES.flatMap((mode) =>
	PAGE_BACKGROUNDS[mode].map((background) => ({
		name: `${mode} / ${background.label}`,
		colors: resolveThemeColors(mode, background.id),
	})),
);

describe("readableTextOn", () => {
	it.each(AVATAR_PALETTE)("reste lisible sur %s", (color) => {
		expect(contrastRatio(readableTextOn(color), color)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
	});
});

describe("readableTint", () => {
	it("garde la couleur lisible, remplace l'autre", () => {
		expect(readableTint("#1f5fbf", "#ffffff", "#2a2118")).toBe("#1f5fbf");
		expect(readableTint("#84cc16", "#ffffff", "#2a2118")).toBe("#2a2118");
	});
});

describe("chipColors", () => {
	it("garde le contour quand la couleur se lit, passe en pastille pleine sinon", () => {
		expect(chipColors("#84cc16", "#16283d").backgroundColor).toBe("transparent");
		expect(chipColors("#84cc16", "#ffffff")).toEqual({
			backgroundColor: "#84cc16",
			borderColor: "#84cc16",
			color: "#000000",
		});
	});

	it.each(THEMES)("$name : chaque couleur de catégorie donne un libellé lisible", ({ colors }) => {
		for (const surface of [colors.background, colors.surface]) {
			for (const color of AVATAR_PALETTE) {
				const chip = chipColors(color, surface);
				const behind = chip.backgroundColor === "transparent" ? surface : chip.backgroundColor;
				expect(contrastRatio(chip.color, behind)).toBeGreaterThanOrEqual(TEXT_CONTRAST);
			}
		}
	});
});
