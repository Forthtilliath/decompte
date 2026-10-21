import {
	contrastRatio,
	readableTextOn,
	TEXT_CONTRAST,
} from "@forthtilliath/ts-kit/color/contrastRatio";

// Teintes de catégorie posées sur le fond du thème : contraste WCAG 2 de ts-kit, seuils propres à
// l'app. Les couleurs sont des hex à 6 chiffres (palettes du thème et des catégories).

/** La couleur elle-même si elle se lit sur ce fond, sinon `fallback` (texte du thème). */
export function readableTint(color: string, surface: string, fallback: string): string {
	return contrastRatio(color, surface) >= TEXT_CONTRAST ? color : fallback;
}

export type ChipColors = {
	backgroundColor: string;
	borderColor: string;
	color: string;
};

/**
 * Puce aux couleurs d'une catégorie : contour et libellé colorés quand la couleur se lit sur le
 * fond, sinon pastille pleine avec un texte blanc ou noir.
 */
export function chipColors(color: string, surface: string): ChipColors {
	if (contrastRatio(color, surface) >= TEXT_CONTRAST) {
		return { backgroundColor: "transparent", borderColor: color, color };
	}
	return { backgroundColor: color, borderColor: color, color: readableTextOn(color) };
}
