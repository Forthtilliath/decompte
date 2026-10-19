import { formatUnitValue, maxUnits, pointsToUnits, unitsToPoints } from "@/lib/units";

describe("unités d'une catégorie « Nombre »", () => {
	it("convertit les unités en points, sans −0", () => {
		expect(unitsToPoints(3, -4)).toBe(-12);
		expect(unitsToPoints(2, 5)).toBe(10);
		expect(Object.is(unitsToPoints(0, -4), 0)).toBe(true);
	});

	it("retrouve le nombre d'unités, arrondi vers zéro hors multiple", () => {
		expect(pointsToUnits(-12, -4)).toBe(3);
		expect(pointsToUnits(-5, -4)).toBe(1);
		expect(pointsToUnits(10, 5)).toBe(2);
	});

	it("ne descend jamais sous zéro unité (score de signe opposé)", () => {
		expect(pointsToUnits(8, -4)).toBe(0);
	});

	it("borne le nombre d'unités par le plafond de points", () => {
		expect(maxUnits(5, 12)).toBe(2);
		expect(maxUnits(5, undefined)).toBeUndefined();
		// Une unité négative fait baisser le score : le plafond ne limite pas le compte.
		expect(maxUnits(-4, 12)).toBeUndefined();
	});

	it("affiche la valeur avec son signe", () => {
		expect(formatUnitValue(-4)).toBe("-4");
		expect(formatUnitValue(3)).toBe("+3");
	});
});
