import { parseNumberOrZero } from "@/lib/numbers";

describe("parseNumberOrZero", () => {
	it("lit les nombres, décimaux et négatifs compris", () => {
		expect(parseNumberOrZero("12")).toBe(12);
		expect(parseNumberOrZero("-2.5")).toBe(-2.5);
	});

	it("vaut 0 pour une saisie vide ou invalide", () => {
		expect(parseNumberOrZero("")).toBe(0);
		expect(parseNumberOrZero("abc")).toBe(0);
		expect(parseNumberOrZero("-")).toBe(0);
	});
});
