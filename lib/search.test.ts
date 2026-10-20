import { matchesSearch, normalizeForSearch } from "@/lib/search";

describe("matchesSearch", () => {
	it("ignore les accents et la casse, dans les deux sens", () => {
		expect(matchesSearch("Éclat de lune", normalizeForSearch("eclat"))).toBe(true);
		expect(matchesSearch("Eclat", normalizeForSearch("ÉCLAT"))).toBe(true);
		expect(matchesSearch("Zoé", normalizeForSearch("zoe"))).toBe(true);
	});

	it("ne trouve rien d'absent ni dans un nom inconnu", () => {
		expect(matchesSearch("Azul", normalizeForSearch("skyjo"))).toBe(false);
		expect(matchesSearch(undefined, normalizeForSearch("azul"))).toBe(false);
	});
});
