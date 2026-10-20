import { MAX_SESSION_SCORE } from "@/lib/gameLimits";
import { applyProducts } from "@/lib/products";
import { makeCategory } from "@/test/factories";

const sets = makeCategory({ id: "sets" });
const bonus = makeCategory({ id: "bonus", brick: { kind: "product", sourceId: "sets" } });
const double = makeCategory({ id: "double", brick: { kind: "product", sourceId: "bonus" } });

describe("applyProducts", () => {
	it("multiplie le nombre saisi par les points de la catégorie, manche par manche", () => {
		const entry = {
			playerId: "a",
			scores: { sets: 4, "sets#2": 5 },
			factors: { bonus: 3, "bonus#2": 2 },
		};
		expect(applyProducts(entry, [sets, bonus]).scores).toEqual({
			sets: 4,
			"sets#2": 5,
			bonus: 12,
			"bonus#2": 10,
		});
	});

	it("compte 0 tant que la catégorie multipliée n'est pas saisie", () => {
		const entry = { playerId: "a", scores: {}, factors: { bonus: 3 } };
		expect(applyProducts(entry, [sets, bonus]).scores).toEqual({ bonus: 0 });
	});

	it("enchaîne les multiplicateurs dans l'ordre du jeu", () => {
		const entry = { playerId: "a", scores: { sets: 2 }, factors: { bonus: 3, double: 2 } };
		expect(applyProducts(entry, [sets, bonus, double]).scores).toMatchObject({
			bonus: 6,
			double: 12,
		});
	});

	it("borne un produit démesuré", () => {
		const entry = { playerId: "a", scores: { sets: MAX_SESSION_SCORE }, factors: { bonus: 100 } };
		expect(applyProducts(entry, [sets, bonus]).scores.bonus).toBe(MAX_SESSION_SCORE);
	});

	it("rend la même entrée quand rien ne change", () => {
		const entry = { playerId: "a", scores: { sets: 2, bonus: 6 }, factors: { bonus: 3 } };
		expect(applyProducts(entry, [sets, bonus])).toBe(entry);
		const plain = { playerId: "a", scores: { sets: 2 } };
		expect(applyProducts(plain, [sets, bonus])).toBe(plain);
	});
});
