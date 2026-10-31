/** Nombre saisi dans un champ de configuration, 0 si la saisie n'en est pas un. */
export function parseNumberOrZero(raw: string): number {
	return Number(raw) || 0;
}
