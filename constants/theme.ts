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
};

/** Palette sombre (par défaut). */
export const DARK_COLORS: ThemeColors = {
	background: "#0f172a",
	surface: "#1e293b",
	surfaceAlt: "#334155",
	border: "#475569",
	text: "#f1f5f9",
	textMuted: "#94a3b8",
	primary: "#3b82f6",
	primaryText: "#f8fafc",
	gold: "#eab308",
	danger: "#ef4444",
	success: "#22c55e",
};

/** Palette claire, même mapping sémantique que la palette sombre (juste inversée en luminosité). */
export const LIGHT_COLORS: ThemeColors = {
	background: "#f8fafc",
	surface: "#ffffff",
	surfaceAlt: "#e2e8f0",
	border: "#cbd5e1",
	text: "#0f172a",
	textMuted: "#64748b",
	primary: "#2563eb",
	primaryText: "#ffffff",
	gold: "#a16207",
	danger: "#dc2626",
	success: "#16a34a",
};

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
