/**
 * Conversions d'une catégorie « Nombre » à valeur par unité (ex. −4 par calamité). Seuls les
 * points sont enregistrés : le nombre d'unités s'en déduit à l'affichage.
 */

/** Nombre d'unités d'un score, arrondi vers zéro s'il a été ajusté à la main hors multiple. */
export function pointsToUnits(points: number, unitValue: number): number {
	return Math.max(0, Math.trunc(points / unitValue));
}

export function unitsToPoints(units: number, unitValue: number): number {
	// `|| 0` évite un −0 (0 × −4) affiché ou enregistré tel quel.
	return units * unitValue || 0;
}

/** Plus grand nombre d'unités sous le plafond de points, `undefined` s'il n'en impose aucun. */
export function maxUnits(unitValue: number, max: number | undefined): number | undefined {
	return max !== undefined && unitValue > 0 ? Math.floor(max / unitValue) : undefined;
}

/** "-4", "+3" : la valeur d'une unité, signe toujours visible. */
export function formatUnitValue(unitValue: number): string {
	return unitValue < 0 ? String(unitValue) : `+${unitValue}`;
}
