import {
	countPlays,
	hasDuplicateName,
	isGroupSelected,
	sortForSelection,
	toggleGroupSelection,
	toggleSelection,
} from "@/lib/players";
import { makePlayer, makeSession } from "@/test/factories";

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

describe("toggleGroupSelection", () => {
	it("ajoute les joueurs manquants à la suite, dans l'ordre du groupe", () => {
		expect(toggleGroupSelection(["b"], ["c", "b", "a"], 6)).toEqual(["b", "c", "a"]);
	});

	it("retire le groupe s'il était déjà entièrement choisi", () => {
		expect(toggleGroupSelection(["x", "a", "b"], ["a", "b"], 6)).toEqual(["x"]);
	});

	it("s'arrête au maximum de joueurs", () => {
		expect(toggleGroupSelection(["x"], ["a", "b", "c"], 3)).toEqual(["x", "a", "b"]);
		const full = ["x", "y"];
		expect(toggleGroupSelection(full, ["a"], 2)).toEqual(full);
	});

	it("un groupe vide ne change rien", () => {
		expect(toggleGroupSelection(["a"], [], 4)).toEqual(["a"]);
		expect(isGroupSelected(["a"], [])).toBe(false);
	});
});

describe("sortForSelection", () => {
	it("met les favoris d'abord, puis les plus fréquents, puis l'ordre alphabétique", () => {
		const players = [
			makePlayer({ id: "zoe", name: "Zoé" }),
			makePlayer({ id: "bob", name: "Bob" }),
			makePlayer({ id: "eve", name: "Ève", isFavorite: true }),
			makePlayer({ id: "alice", name: "Alice" }),
		];
		const counts = countPlays([
			makeSession({ playerIds: ["zoe", "bob"] }),
			makeSession({ playerIds: ["zoe"] }),
		]);
		expect(sortForSelection(players, counts).map((p) => p.id)).toEqual([
			"eve",
			"zoe",
			"bob",
			"alice",
		]);
	});
});
