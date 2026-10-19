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

	it("supprime les clés inconnues, dont la photo d'un joueur", () => {
		const data = {
			...validBackup(),
			extra: "ignoré",
			players: [{ ...makePlayer({ id: "alice" }), avatarUri: "https://exemple.com/pistage.png" }],
		};
		const restored = parse(data);
		expect(restored).not.toHaveProperty("extra");
		expect(restored.players[0]).not.toHaveProperty("avatarUri");
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
