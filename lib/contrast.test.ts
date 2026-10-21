import { PAGE_BACKGROUNDS, resolveThemeColors } from "@/constants/backgrounds";
import { AVATAR_PALETTE } from "@/lib/avatarColor";
import {
	chipColors,
	contrastRatio,
	readableTextOn,
	readableTint,
	TEXT_CONTRAST,
} from "@/lib/contrast";

const THEMES = (["dark", "light"] as const).flatMap((mode) =>
	PAGE_BACKGROUNDS[mode].map((background) => ({
		name: `${mode} / ${background.label}`,
		colors: resolveThemeColors(mode, background.id),
	})),
);

describe("contrastRatio", () => {
	it("vaut 21 entre le noir et le blanc, 1 entre deux couleurs identiques", () => {
		expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
		expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21);
		expect(contrastRatio("#3b82f6", "#3b82f6")).toBe(1);
	});
});

describe("readableTextOn", () => {
	it("choisit le blanc sur un fond foncé, le noir sur un fond clair", () => {
		expect(readableTextOn("#16283d")).toBe("#ffffff");
		expect(readableTextOn("#84cc16")).toBe("#000000");
	});

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
