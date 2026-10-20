import { describeDataIssues, rescueCopyUris } from "@/lib/dataIssues";
import type { DataIssue } from "@/stores/dataIssuesStore";

const issue = (storeName: string, kind: DataIssue["kind"], copyUri: string | null = null) => ({
	storeName,
	kind,
	copyUri,
});

describe("describeDataIssues", () => {
	it("nomme les données concernées et rassure sur la copie gardée", () => {
		const text = describeDataIssues([issue("games-store", "migration")]);
		expect(text).toContain("n'ont pas pu être reprises : les jeux.");
		expect(text).toContain("ne sait pas les convertir");
		expect(text).toContain("rien n'est effacé");
		expect(text).toContain("avant toute modification");
	});

	it("réunit plusieurs stores et ne répète pas une même cause", () => {
		const text = describeDataIssues([
			issue("games-store", "newer"),
			issue("players-store", "newer"),
			issue("history-store", "invalid"),
		]);
		expect(text).toContain(": les jeux, les joueurs et l'historique des parties.");
		expect(text.match(/plus récente/g)).toHaveLength(1);
		expect(text).toContain("illisibles");
	});
});

describe("rescueCopyUris", () => {
	it("garde les copies exportables, sans doublon", () => {
		expect(
			rescueCopyUris([
				issue("games-store", "invalid", "file:///a.json"),
				issue("players-store", "invalid", null),
				issue("games-store", "invalid", "file:///a.json"),
			]),
		).toEqual(["file:///a.json"]);
	});
});
