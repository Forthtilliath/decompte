import { plural } from "@/lib/plural";

describe("plural", () => {
	// Hermes (Android) n'a pas Intl.PluralRules : l'appel ne doit pas en dépendre.
	beforeEach(() => {
		jest.spyOn(Intl, "PluralRules").mockImplementation(() => {
			throw new TypeError("Intl.PluralRules is not a constructor");
		});
	});
	afterEach(() => {
		jest.restoreAllMocks();
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
