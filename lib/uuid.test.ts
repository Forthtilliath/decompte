import { createId } from "@/lib/uuid";

describe("createId", () => {
	it("génère des identifiants de 21 caractères sûrs dans une URL", () => {
		expect(createId()).toMatch(/^[A-Za-z0-9_-]{21}$/);
	});

	it("ne génère pas deux fois le même identifiant", () => {
		const ids = new Set(Array.from({ length: 5000 }, createId));
		expect(ids.size).toBe(5000);
	});
});
