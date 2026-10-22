import type { TextStyle, ViewStyle } from "react-native";

/**
 * Décor propre à un thème, au-delà des couleurs : contours, ombres, motif de fond et police.
 * Vide pour les thèmes sombre et clair, qui gardent leur apparence d'origine.
 */
export type ThemeDecor = {
	/**
	 * Contour et ombre portée des cartes. Étalé en fin de style, il remplace le contour de la carte ;
	 * étalé en tête, le contour propre à la carte (avertissement or…) reste prioritaire.
	 */
	card: ViewStyle;
	/** Bouton « jeton » en relief. */
	raised: ViewStyle;
	/** État enfoncé d'un bouton en relief, à défaut un simple fondu. */
	raisedPressed?: ViewStyle;
	/** En-têtes d'écran, à défaut `surface` et `text`. */
	header?: { background: string; text: string };
	/** Fusionné au style de la barre d'onglets. */
	tabBar?: ViewStyle;
	/** Motif de pièces de jeu dessiné en filigrane derrière les écrans. */
	pattern?: { color: string; opacity: number };
	/** Police des titres, boutons et onglets (intégrée au build par le plugin expo-font). */
	displayFont?: string;
	/** Icône d'onglet active posée sur un pion de sa couleur. */
	tabTokens?: boolean;
};

export const NO_DECOR: ThemeDecor = { card: {}, raised: {} };

/** Police d'affiche du thème, en graisse normale (la police n'a qu'une graisse), sinon rien. */
export function displayFont(colors: ThemeColors): TextStyle {
	const fontFamily = colors.decor.displayFont;
	return fontFamily ? { fontFamily, fontWeight: "400" } : {};
}

export type ThemeColors = {
	background: string;
	surface: string;
	surfaceAlt: string;
	border: string;
	text: string;
	textMuted: string;
	primary: string;
	primaryText: string;
	gold: string;
	danger: string;
	success: string;
	/** Couleur de l'onglet Stats, en plus des 4 pions. */
	purple: string;
	decor: ThemeDecor;
};

// Thème jeu de société : bleu, rouge, vert et jaune (or) sont les couleurs des pions classiques.
// Contrastes vérifiés (WCAG) : texte blanc sur bleu/rouge/vert ≥ 4,5, ces teintes en icône sur
// `surface` ≥ 3. Garder des hex à 6 chiffres : certains écrans y ajoutent un suffixe d'opacité.

/** Palette sombre « table de jeu » (par défaut) : bleu nuit, cartes ardoise. */
export const DARK_COLORS: ThemeColors = {
	background: "#0d1b2a",
	surface: "#16283d",
	surfaceAlt: "#22374f",
	border: "#35506e",
	text: "#eef3f8",
	textMuted: "#94a8be",
	primary: "#2f74d0",
	primaryText: "#ffffff",
	gold: "#f2b632",
	danger: "#d63c41",
	success: "#1b8448",
	purple: "#9d6ce0",
	decor: NO_DECOR,
};

/** Palette claire « plateau carton » : crème de boîte de jeu, même mapping sémantique. */
export const LIGHT_COLORS: ThemeColors = {
	background: "#f3ead8",
	surface: "#fffaf0",
	surfaceAlt: "#ebdfc6",
	border: "#d6c4a1",
	text: "#2a2118",
	textMuted: "#6b5c47",
	primary: "#1f5fbf",
	primaryText: "#ffffff",
	gold: "#9a6a00",
	danger: "#c0352f",
	success: "#1f7a45",
	purple: "#7440b5",
	decor: NO_DECOR,
};

/** Encre des contours et ombres du thème Ludique, comme le trait d'un plateau imprimé. */
const LUDO_INK = "#24170f";

/** Contour à l'encre et ombre portée nette (sans flou), décalée de (x, y). */
function inked(x: number, y: number): ViewStyle {
	return { borderWidth: 2, borderColor: LUDO_INK, boxShadow: `${x}px ${y}px 0px ${LUDO_INK}` };
}

/**
 * Thème « Ludique » : plateau de jeu imprimé. Papier crème, cartes cernées d'encre avec une ombre
 * portée nette (sans flou), boutons-jetons en relief, pions en couleurs franches et police
 * d'affiche de boîte de jeu.
 */
export const LUDO_COLORS: ThemeColors = {
	background: "#f2ddb3",
	surface: "#fff7e6",
	surfaceAlt: "#f6e4bf",
	border: "#5c4330",
	text: LUDO_INK,
	textMuted: "#634a36",
	primary: "#1d5fd1",
	primaryText: "#ffffff",
	gold: "#a86d00",
	danger: "#cf2e26",
	success: "#1a7d38",
	purple: "#7b3fc4",
	decor: {
		card: inked(3, 3),
		raised: inked(0, 4),
		raisedPressed: { transform: [{ translateY: 3 }], boxShadow: `0px 1px 0px ${LUDO_INK}` },
		header: { background: LUDO_INK, text: "#fff7e6" },
		tabBar: { borderTopWidth: 2, borderTopColor: LUDO_INK },
		pattern: { color: LUDO_INK, opacity: 0.07 },
		displayFont: "LilitaOne_400Regular",
		tabTokens: true,
	},
};

/**
 * Agrandissement maximal du texte (Réglages Android ▸ Taille de police) dans les zones à largeur
 * fixe : boutons du stepper, tableau des stats, rang et total d'un classement. Ailleurs, le texte
 * suit la taille choisie sans limite.
 */
export const TIGHT_FONT_SCALE = 1.3;

export const RADIUS = {
	sm: 8,
	md: 12,
	lg: 20,
	full: 999,
} as const;

export const SPACING = {
	xs: 4,
	sm: 8,
	md: 16,
	lg: 24,
	xl: 32,
} as const;
