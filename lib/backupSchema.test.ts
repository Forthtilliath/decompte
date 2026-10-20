import { getAppDirectory } from "@forthtilliath/react-native-kit/utils/files/appFiles";
import {
	BACKUP_APP_ID,
	BACKUP_DATA_VERSION,
	type BackupData,
	parseBackup,
} from "@/lib/backupSchema";
import {
	makeCategory,
	makeEntry,
	makeGame,
	makeGroup,
	makePlayer,
	makeSession,
} from "@/test/factories";

function validBackup(overrides: Partial<BackupData> = {}): BackupData {
	return {
		app: BACKUP_APP_ID,
		dataVersion: BACKUP_DATA_VERSION,
		exportedAt: 1_700_000_000_000,
		games: [makeGame()],
		players: [makePlayer({ id: "alice" })],
		groups: [makeGroup({ playerIds: ["alice"] })],
		sessions: [
			makeSession({ playerIds: ["alice"], entries: { alice: makeEntry("alice", { c1: 12 }) } }),
		],
		...overrides,
	};
}

const parse = (data: unknown) => parseBackup(JSON.stringify(data));

describe("parseBackup", () => {
	it("relit une sauvegarde valide à l'identique", () => {
		expect(parse(validBackup())).toEqual(validBackup());
	});

	it("régénère l'id des options d'une catégorie « choix »", () => {
		const brick = {
			kind: "choice" as const,
			options: [
				{ id: "o1", label: "Bas", value: 1 },
				{ id: "o2", label: "Haut", value: 5 },
			],
		};
		const data = validBackup({ games: [makeGame({ categories: [makeCategory({ brick })] })] });

		const restored = parse(data).games[0].categories[0].brick;
		expect(restored.kind).toBe("choice");
		if (restored.kind !== "choice") return;
		expect(restored.options.map((o) => [o.label, o.value])).toEqual([
			["Bas", 1],
			["Haut", 5],
		]);
		expect(restored.options[0].id).not.toBe("o1");
	});

	it("supprime les clés inconnues", () => {
		const restored = parse({ ...validBackup(), extra: "ignoré" });
		expect(restored).not.toHaveProperty("extra");
	});

	it("ne charge jamais une photo venue du fichier", () => {
		const data = validBackup({
			players: [makePlayer({ id: "alice", avatarUri: "https://exemple.com/pistage.png" })],
		});
		expect(parse(data).players[0]).not.toHaveProperty("avatarUri");
	});

	it("reprend la photo du même nom encore présente dans l'app", () => {
		jest.mocked(getAppDirectory).mockReturnValueOnce({
			list: () => [{ uri: "file:///data/user/0/app/files/avatars/avatar-1.jpg" }],
		} as unknown as ReturnType<typeof getAppDirectory>);
		const data = validBackup({
			players: [
				makePlayer({ id: "alice", avatarUri: "file:///data/data/app/files/avatars/avatar-1.jpg" }),
				makePlayer({ id: "bob", avatarUri: "file:///autre-telephone/avatars/avatar-2.jpg" }),
			],
		});
		const [alice, bob] = parse(data).players;
		expect(alice.avatarUri).toBe("file:///data/user/0/app/files/avatars/avatar-1.jpg");
		expect(bob).not.toHaveProperty("avatarUri");
	});

	it("garde les manches d'un jeu et tous les scores de ses parties", () => {
		const categories = Array.from({ length: 30 }, (_, i) => makeCategory({ id: `c${i}` }));
		const scores = Object.fromEntries(
			categories.flatMap((c) => [
				[c.id, 1],
				[`${c.id}#2`, 2],
			]),
		);
		const data = validBackup({
			games: [makeGame({ rounds: 2, categories })],
			sessions: [
				makeSession({ playerIds: ["alice"], entries: { alice: makeEntry("alice", scores) } }),
			],
		});
		const restored = parse(data);
		expect(restored.games[0].rounds).toBe(2);
		expect(Object.keys(restored.sessions[0].entries.alice.scores)).toHaveLength(60);
	});

	it("garde les critères à valider des jeux et ceux validés dans les parties", () => {
		const data = validBackup({
			games: [makeGame({ categories: [makeCategory({ requiresValidation: true })] })],
			sessions: [
				makeSession({
					playerIds: ["alice"],
					entries: { alice: { ...makeEntry("alice", { c1: 4 }), validated: ["c1", "c1#2"] } },
				}),
			],
		});
		expect(parse(data)).toEqual(data);
	});

	it("garde un multiplicateur et ses nombres saisis", () => {
		const game = makeGame({
			categories: [
				makeCategory({ id: "c1" }),
				makeCategory({ id: "p", brick: { kind: "product", sourceId: "c1" } }),
			],
		});
		const session = makeSession({
			playerIds: ["alice"],
			entries: { alice: { ...makeEntry("alice", { c1: 4, p: 12 }), factors: { p: 3 } } },
		});
		const data = validBackup({ games: [game], sessions: [session] });
		expect(parse(data)).toEqual(data);
	});

	it("garde les règles de classement et les équipes", () => {
		const game = makeGame({ lowestWins: true, tieBreakerId: "c1", teamPlay: true });
		const session = makeSession({
			playerIds: ["alice", "bob"],
			entries: { alice: makeEntry("alice"), bob: makeEntry("bob") },
			lowestWins: true,
			tieBreakerId: "c1",
			teams: [
				{ id: "t1", name: "Équipe 1", playerIds: ["alice"] },
				{ id: "t2", name: "Équipe 2", playerIds: ["bob"] },
			],
		});
		const data = validBackup({ games: [game], sessions: [session] });
		expect(parse(data)).toEqual(data);
	});

	it.each([
		["un texte qui n'est pas du JSON", "pas du json", /illisible/],
		[
			"une autre app",
			JSON.stringify({ ...validBackup(), app: "7wonders-assistant" }),
			/pas une sauvegarde Décompte/,
		],
		[
			"une version plus récente",
			JSON.stringify({ ...validBackup(), dataVersion: 99 }),
			/plus récente/,
		],
	])("refuse %s", (_, text, message) => {
		expect(() => parseBackup(text)).toThrow(message);
	});

	it.each<[string, Partial<BackupData>]>([
		[
			"une couleur de catégorie invalide",
			{ games: [makeGame({ categories: [makeCategory({ color: "red" })] })] },
		],
		[
			"un jeu au minimum de joueurs supérieur au maximum",
			{ games: [makeGame({ minPlayers: 5, maxPlayers: 2 })] },
		],
		["un nom de joueur vide", { players: [makePlayer({ name: "  " })] }],
		[
			"un score hors bornes",
			{ sessions: [makeSession({ entries: { a: makeEntry("a", { c1: 1e12 }) } })] },
		],
		[
			"un critère à valider qui n'est pas un booléen",
			{
				games: [makeGame({ categories: [{ ...makeCategory(), requiresValidation: 1 as never }] })],
			},
		],
		[
			"un critère validé à la clé invalide",
			{
				sessions: [makeSession({ entries: { a: { ...makeEntry("a"), validated: ["c1#2#3"] } } })],
			},
		],
		["des notes trop longues", { sessions: [makeSession({ notes: "x".repeat(1001) })] }],
		["un départage sur une catégorie inconnue", { games: [makeGame({ tieBreakerId: "x" })] }],
		[
			"un multiplicateur sur une catégorie placée après lui",
			{
				games: [
					makeGame({
						categories: [
							makeCategory({ id: "p", brick: { kind: "product", sourceId: "c1" } }),
							makeCategory({ id: "c1" }),
						],
					}),
				],
			},
		],
		[
			"un nombre de multiplicateur hors bornes",
			{
				sessions: [makeSession({ entries: { a: { ...makeEntry("a"), factors: { c1: 1000 } } } })],
			},
		],
		[
			"un joueur dans deux équipes",
			{
				sessions: [
					makeSession({
						teams: [
							{ id: "t1", name: "A", playerIds: ["p1"] },
							{ id: "t2", name: "B", playerIds: ["p1", "p2"] },
						],
					}),
				],
			},
		],
		[
			"une équipe avec un joueur absent de la partie",
			{ sessions: [makeSession({ teams: [{ id: "t1", name: "A", playerIds: ["intrus"] }] })] },
		],
		["des joueurs au même id", { players: [makePlayer({ id: "a" }), makePlayer({ id: "a" })] }],
		[
			"une partie à plus de joueurs que la limite",
			{
				sessions: [
					makeSession({
						entries: Object.fromEntries(
							Array.from({ length: 51 }, (_, i) => [`p${i}`, makeEntry(`p${i}`)]),
						),
					}),
				],
			},
		],
	])("rejette le fichier entier pour %s", (_, overrides) => {
		expect(() => parse(validBackup(overrides))).toThrow(/Sauvegarde corrompue ou modifiée/);
	});
});
