/**
 * Copie de `items` où l'élément d'indice `from` est décalé de `offset` places (négatif = vers le
 * début). Renvoie `items` tel quel si `from` est hors du tableau ou si la destination en sort.
 */
export function moveItem<T>(items: T[], from: number, offset: number): T[] {
	const to = from + offset;
	if (from < 0 || from >= items.length || to < 0 || to >= items.length || to === from) {
		return items;
	}
	const next = [...items];
	const [item] = next.splice(from, 1);
	next.splice(to, 0, item);
	return next;
}
