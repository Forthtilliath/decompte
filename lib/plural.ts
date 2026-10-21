import { createPluralize } from "@forthtilliath/ts-kit/string/pluralize";

/**
 * Accorde un mot au nombre, à la française : singulier pour 0 et 1 (« 0 partie », « 1,5 point »),
 * pluriel au-delà. Sans pluriel fourni, ajoute un « s » sauf après s, x ou z. Sous Hermes, sans
 * `Intl.PluralRules`, ts-kit applique la même règle.
 */
export const plural = createPluralize("fr");
