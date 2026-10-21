import { plural } from "@/lib/plural";

const { PluralRules } = Intl;

// Hermes (Android) n'a pas Intl.PluralRules : même résultat avec et sans.
describe.each([
	["avec Intl.PluralRules", PluralRules],
	["sans Intl.PluralRules (Hermes)", undefined],
])("plural %s", (_, rules) => {
	beforeEach(() => {
		Object.defineProperty(Intl, "PluralRules", { value: rules, configurable: true });
	});
	afterAll(() => {
		Object.defineProperty(Intl, "PluralRules", { value: PluralRules, configurable: true });
	});

	it("garde le singulier pour 0 et 1", () => {
		expect(plural(0, "partie")).toBe("partie");
		expect(plural(1, "partie")).toBe("partie");
		expect(plural(1.5, "point")).toBe("point");
	});

	it("ajoute un s au-delà de 1", () => {
		expect(plural(2, "victoire")).toBe("victoires");
		expect(plural(-3, "point")).toBe("points");
	});

	it("n'ajoute rien après s, x ou z", () => {
		expect(plural(2, "gaz")).toBe("gaz");
		expect(plural(4, "choix")).toBe("choix");
	});

	it("utilise le pluriel fourni", () => {
		expect(plural(3, "jeu", "jeux")).toBe("jeux");
		expect(plural(1, "jeu", "jeux")).toBe("jeu");
	});
});
