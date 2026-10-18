/** Retire d'une saisie clavier tout ce qui n'est ni chiffre ni (si autorisé) signe moins. */
export function sanitizeIntegerInput(raw: string, allowNegative: boolean): string {
	return allowNegative ? raw.replace(/[^\d-]/g, "") : raw.replace(/\D/g, "");
}

/**
 * Entier représenté par une saisie, ou `null` tant qu'elle n'en est pas un (champ vide, "-" seul
 * en cours de frappe, "1-2"...) : l'appelant garde alors la dernière valeur valide.
 */
export function parseIntegerInput(raw: string): number | null {
	return /^-?\d+$/.test(raw) ? Number.parseInt(raw, 10) : null;
}

/** Nombre saisi dans un champ de configuration, 0 si la saisie n'en est pas un. */
export function parseNumberOrZero(raw: string): number {
	return Number(raw) || 0;
}
