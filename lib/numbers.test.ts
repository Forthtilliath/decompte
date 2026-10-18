import { parseIntegerInput, parseNumberOrZero, sanitizeIntegerInput } from "@/lib/numbers";

describe("sanitizeIntegerInput", () => {
	it("ne garde que les chiffres sans négatif autorisé", () => {
		expect(sanitizeIntegerInput("-1 2a3.4", false)).toBe("1234");
	});

	it("garde le signe moins quand le négatif est autorisé", () => {
		expect(sanitizeIntegerInput("-1 2a3", true)).toBe("-123");
	});
});

describe("parseIntegerInput", () => {
	it.each([
		["0", 0],
		["42", 42],
		["-13", -13],
		["007", 7],
	])("lit %p comme %p", (raw, expected) => {
		expect(parseIntegerInput(raw)).toBe(expected);
	});

	it.each(["", "-", "1-2", "--3", "4.5", " 3"])("refuse la saisie incomplète %p", (raw) => {
		expect(parseIntegerInput(raw)).toBeNull();
	});
});

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
