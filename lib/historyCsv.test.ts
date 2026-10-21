import { indexById } from "@forthtilliath/ts-kit/array/indexById";
import { buildHistoryCsv } from "@/lib/historyCsv";
import { makeCategory, makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";

const game = makeGame({
	id: "azul",
	name: "Azul",
	categories: [
		makeCategory({ id: "murs", label: "Murs" }),
		makeCategory({ id: "bonus", label: "Bonus" }),
	],
});
const players = [
	makePlayer({ id: "alice", name: "Alice" }),
	makePlayer({ id: "bob", name: "Bob" }),
];

function csv(sessions = [makeSession()]) {
	return buildHistoryCsv(sessions, indexById([game]), indexById(players));
}

const lines = (text: string) => text.slice(1).split("\r\n");

describe("buildHistoryCsv", () => {
	it("écrit une ligne par joueur et par partie, dans l'ordre du classement", () => {
		const session = makeSession({
			gameDefId: "azul",
			createdAt: new Date(2026, 9, 20, 21, 30).getTime(),
			playerIds: ["alice", "bob"],
			entries: {
				alice: makeEntry("alice", { murs: 10, "murs#2": 2 }),
				bob: makeEntry("bob", { murs: 20, bonus: -3 }),
			},
			notes: "Partie serrée; revanche",
		});
		const text = csv([session]);

		expect(text.charCodeAt(0)).toBe(0xfeff);
		expect(lines(text)).toEqual([
			"Date;Jeu;Joueur;Équipe;Rang;Total;Détail;Notes",
			'2026-10-20;Azul;Bob;;1;17;Murs : 20 | Bonus : -3;"Partie serrée; revanche"',
			'2026-10-20;Azul;Alice;;2;12;Murs : 12;"Partie serrée; revanche"',
		]);
	});

	it("indique l'équipe de chaque joueur", () => {
		const session = makeSession({
			gameDefId: "azul",
			playerIds: ["alice", "bob"],
			entries: { alice: makeEntry("alice"), bob: makeEntry("bob") },
			teams: [
				{ id: "t1", name: "Rouges", playerIds: ["alice"] },
				{ id: "t2", name: "Bleus", playerIds: ["bob"] },
			],
		});
		expect(
			lines(csv([session]))
				.slice(1)
				.map((l) => l.split(";")[3]),
		).toEqual(["Rouges", "Bleus"]);
	});

	it("neutralise une formule cachée dans un texte saisi", () => {
		const evil = makePlayer({ id: "alice", name: '=HYPERLINK("http://x","clic")' });
		const session = makeSession({
			gameDefId: "azul",
			playerIds: ["alice"],
			entries: { alice: makeEntry("alice") },
			notes: "+cmd",
		});
		const [, row] = lines(buildHistoryCsv([session], indexById([game]), indexById([evil])));
		expect(row).toContain(`"'=HYPERLINK(""http://x"",""clic"")"`);
		expect(row.endsWith(";'+cmd")).toBe(true);
	});

	it("garde un joueur supprimé et un jeu disparu, sous un libellé neutre", () => {
		const session = makeSession({
			gameDefId: "disparu",
			playerIds: ["inconnu"],
			entries: { inconnu: makeEntry("inconnu", { x: 4 }) },
		});
		const [, row] = lines(csv([session]));
		expect(row.split(";").slice(1, 3)).toEqual(["Jeu introuvable", "Joueur supprimé"]);
		expect(row).toContain("Catégorie retirée : 4");
	});
});
