import { hasDuplicateName, toggleSelection } from "@/lib/players";
import { makePlayer } from "@/test/factories";

describe("hasDuplicateName", () => {
	const players = [makePlayer({ id: "p1", name: "Alice" }), makePlayer({ id: "p2", name: "Bob" })];

	it("détecte un nom déjà pris", () => {
		expect(hasDuplicateName(players, "Alice")).toBe(true);
	});

	it("ignore la casse et les espaces superflus", () => {
		expect(hasDuplicateName(players, "  aLiCe ")).toBe(true);
	});

	it("ne signale rien pour un nom libre", () => {
		expect(hasDuplicateName(players, "Charlie")).toBe(false);
	});

	it("ne signale rien pour un nom vide", () => {
		expect(hasDuplicateName(players, "   ")).toBe(false);
	});

	it("ignore le joueur en cours de renommage", () => {
		expect(hasDuplicateName(players, "Alice", "p1")).toBe(false);
		expect(hasDuplicateName(players, "Bob", "p1")).toBe(true);
	});

	it("compte aussi les joueurs archivés", () => {
		const withArchived = [makePlayer({ id: "p3", name: "Zoé", isArchived: true })];
		expect(hasDuplicateName(withArchived, "zoé")).toBe(true);
	});
});

describe("toggleSelection", () => {
	it("ajoute un joueur non sélectionné", () => {
		expect(toggleSelection(["a"], "b", 4)).toEqual(["a", "b"]);
	});

	it("retire un joueur déjà sélectionné", () => {
		expect(toggleSelection(["a", "b"], "a", 4)).toEqual(["b"]);
	});

	it("n'ajoute plus personne une fois le maximum atteint", () => {
		const full = ["a", "b"];
		expect(toggleSelection(full, "c", 2)).toBe(full);
	});

	it("permet encore de retirer quelqu'un au maximum", () => {
		expect(toggleSelection(["a", "b"], "b", 2)).toEqual(["a"]);
	});
});
