import { indexById } from "@/lib/byId";

describe("indexById", () => {
	it("retrouve chaque élément par son id", () => {
		const alice = { id: "alice", name: "Alice" };
		const bob = { id: "bob", name: "Bob" };
		const byId = indexById([alice, bob]);

		expect(byId.get("bob")).toBe(bob);
		expect(byId.get("alice")).toBe(alice);
		expect(byId.get("carole")).toBeUndefined();
	});

	it("est vide pour une liste vide", () => {
		expect(indexById([]).size).toBe(0);
	});
});
