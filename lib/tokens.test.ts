import { computeTokensTotal } from "@/lib/tokens";

const SEVEN_WONDERS = [
	{ label: "Victoire +1", value: 1 },
	{ label: "Victoire +3", value: 3 },
	{ label: "Victoire +5", value: 5 },
	{ label: "Défaite", value: -1 },
];

describe("computeTokensTotal", () => {
	it("vaut 0 sans jeton", () => {
		expect(computeTokensTotal([], [])).toBe(0);
	});

	it("pondère chaque nombre de jetons par sa valeur (même index)", () => {
		expect(computeTokensTotal(SEVEN_WONDERS, [2, 1, 1, 0])).toBe(10);
	});

	it("soustrait les jetons de valeur négative", () => {
		expect(computeTokensTotal(SEVEN_WONDERS, [0, 1, 0, 4])).toBe(-1);
	});

	it("compte 0 pour une dénomination sans compteur", () => {
		expect(computeTokensTotal(SEVEN_WONDERS, [1])).toBe(1);
	});

	it("ignore les compteurs en trop", () => {
		expect(computeTokensTotal(SEVEN_WONDERS.slice(0, 1), [2, 99])).toBe(2);
	});
});
