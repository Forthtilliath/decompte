import { normalizeForSearch } from "@forthtilliath/ts-kit/string/normalizeForSearch";

/**
 * Vrai si `text` contient la recherche `query`, sans tenir compte de la casse ni des accents
 * (« eclat » trouve « Éclat »). `query` est déjà normalisée par `normalizeForSearch`, une seule
 * fois pour toute la liste.
 */
export function matchesSearch(text: string | undefined, query: string): boolean {
	return text !== undefined && normalizeForSearch(text).includes(query);
}

export { normalizeForSearch };
