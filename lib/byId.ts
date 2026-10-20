/**
 * Index par id, à construire une fois (`useMemo`) pour remplacer un `find` par élément affiché
 * (une liste de parties × ses joueurs) par une lecture directe. À id en double, le dernier gagne.
 */
export function indexById<T extends { id: string }>(items: readonly T[]): ReadonlyMap<string, T> {
	return new Map(items.map((item) => [item.id, item]));
}
