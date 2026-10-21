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
