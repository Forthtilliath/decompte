/**
 * Accorde un mot au nombre, à la française : singulier pour 0 et 1 (« 0 partie », « 1,5 point »),
 * pluriel au-delà. Sans pluriel fourni, ajoute un « s » sauf après s, x ou z.
 *
 * N'utilise pas `Intl.PluralRules` (ni `pluralize` de ts-kit, qui s'en sert) : Hermes, le moteur
 * JS de l'app Android, ne le fournit pas, et l'appel ferme l'app.
 */
export function plural(count: number, singular: string, pluralForm?: string): string {
	if (Math.abs(count) < 2) return singular;
	return pluralForm ?? (/[sxz]$/i.test(singular) ? singular : `${singular}s`);
}
