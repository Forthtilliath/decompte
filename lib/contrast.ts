// Contrastes WCAG 2 : 4,5 pour du texte courant, 3 pour un élément graphique (barre, pastille).
// Les couleurs sont des hex à 6 chiffres (palettes du thème et des catégories).

/** Seuil WCAG AA d'un texte de taille courante. */
export const TEXT_CONTRAST = 4.5;

const WHITE = "#ffffff";
const BLACK = "#000000";

function luminance(hex: string): number {
	const [r, g, b] = [1, 3, 5].map((i) => {
		const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
		return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
	});
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rapport de contraste entre deux couleurs, de 1 (identiques) à 21 (noir sur blanc). */
export function contrastRatio(a: string, b: string): number {
	const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (light + 0.05) / (dark + 0.05);
}

/**
 * Texte blanc ou noir, le plus lisible sur ce fond. Le noir et le blanc purs garantissent
 * toujours au moins 4,58 : au pire, le fond est à égale distance des deux.
 */
export function readableTextOn(background: string): string {
	return contrastRatio(WHITE, background) >= contrastRatio(BLACK, background) ? WHITE : BLACK;
}

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
