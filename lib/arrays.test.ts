import { moveItem } from "@/lib/arrays";

describe("moveItem", () => {
	it("remonte un élément d'une place", () => {
		expect(moveItem(["a", "b", "c"], 2, -1)).toEqual(["a", "c", "b"]);
	});

	it("descend un élément d'une place", () => {
		expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
	});

	it("déplace de plusieurs places sans perdre d'élément", () => {
		expect(moveItem(["a", "b", "c", "d"], 0, 3)).toEqual(["b", "c", "d", "a"]);
	});

	it("ne modifie pas le tableau d'origine", () => {
		const items = ["a", "b"];
		moveItem(items, 0, 1);
		expect(items).toEqual(["a", "b"]);
	});

	it("renvoie le même tableau quand la destination sort des bornes", () => {
		const items = ["a", "b"];
		expect(moveItem(items, 0, -1)).toBe(items);
		expect(moveItem(items, 1, 1)).toBe(items);
	});

	it("renvoie le même tableau pour un indice introuvable ou un décalage nul", () => {
		const items = ["a", "b"];
		expect(moveItem(items, -1, 1)).toBe(items);
		expect(moveItem(items, 0, 0)).toBe(items);
	});
});
