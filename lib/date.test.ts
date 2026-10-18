import { formatDate } from "@/lib/date";

describe("formatDate", () => {
	// Midi UTC : la date reste la même quel que soit le fuseau de la machine qui lance les tests.
	it("affiche la date en toutes lettres, en français", () => {
		expect(formatDate(Date.UTC(2026, 9, 19, 12))).toBe("19 octobre 2026");
	});

	it("garde le zéro initial du jour", () => {
		expect(formatDate(Date.UTC(2026, 0, 5, 12))).toBe("05 janvier 2026");
	});
});
