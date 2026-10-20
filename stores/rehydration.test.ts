import { readPersisted, writePersisted } from "@forthtilliath/test-kit/persistedState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MigrationSteps } from "@/lib/persistedState";
import { useDataIssuesStore } from "@/stores/dataIssuesStore";
import { GAMES_MIGRATIONS, GAMES_STORE_VERSION, useGamesStore } from "@/stores/gamesStore";
import { GROUPS_MIGRATIONS, GROUPS_STORE_VERSION } from "@/stores/groupsStore";
import { HISTORY_MIGRATIONS, HISTORY_STORE_VERSION } from "@/stores/historyStore";
import { PLAYERS_MIGRATIONS, PLAYERS_STORE_VERSION, usePlayersStore } from "@/stores/playersStore";
import { SESSION_MIGRATIONS, SESSION_STORE_VERSION, useSessionStore } from "@/stores/sessionStore";
import { THEME_STORE_VERSION, useThemeStore } from "@/stores/themeStore";
import { makeCategory, makeEntry, makeGame, makePlayer } from "@/test/factories";
import { memoryFiles, resetMemoryFiles } from "@/test/fileSystem";

jest.mock("expo-file-system", () => require("@/test/fileSystem").memoryFileSystem);
jest.mock("@forthtilliath/react-native-kit/utils/files/appFiles", () =>
	jest.requireActual("@forthtilliath/react-native-kit/utils/files/appFiles"),
);

const readCopy = (name: string) =>
	JSON.parse(memoryFiles.get(`file:///documents/secours/${name}`) ?? "null");

beforeEach(async () => {
	await AsyncStorage.clear();
	resetMemoryFiles();
	useDataIssuesStore.getState().clear();
	useGamesStore.setState({ games: [] });
	usePlayersStore.setState({ players: [] });
	useSessionStore.getState().resetSession();
});

describe("versions des stores", () => {
	// Incrémenter une version sans écrire son étape viderait le store chez tous les utilisateurs.
	it.each<[string, number, MigrationSteps]>([
		["jeux", GAMES_STORE_VERSION, GAMES_MIGRATIONS],
		["joueurs", PLAYERS_STORE_VERSION, PLAYERS_MIGRATIONS],
		["groupes", GROUPS_STORE_VERSION, GROUPS_MIGRATIONS],
		["historique", HISTORY_STORE_VERSION, HISTORY_MIGRATIONS],
		["partie en cours", SESSION_STORE_VERSION, SESSION_MIGRATIONS],
	])("%s : une étape de migration par version antérieure", (_, version, steps) => {
		const expected = Array.from({ length: version - 1 }, (__, i) => String(i + 1));
		expect(Object.keys(steps)).toEqual(expected);
	});
});

describe("relecture des stores", () => {
	it("recharge des jeux valides", async () => {
		const games = [makeGame()];
		await writePersisted(AsyncStorage, "games-store", { games }, GAMES_STORE_VERSION);

		await useGamesStore.persist.rehydrate();

		expect(useGamesStore.getState().games).toEqual(games);
		expect(memoryFiles.size).toBe(0);
	});

	it("convertit des jeux v1 (plancher `min`) et garde une copie d'origine", async () => {
		const legacyGame = {
			...makeGame({ id: "v1" }),
			categories: [
				{ ...makeCategory({ id: "neg" }), brick: { kind: "manual", min: -10, max: 50 } },
				{ ...makeCategory({ id: "pos" }), brick: { kind: "manual" } },
				{
					...makeCategory({ id: "jetons" }),
					brick: { kind: "tokens", tokens: [{ label: "Victoire", value: 1 }] },
				},
			],
		};
		await writePersisted(AsyncStorage, "games-store", { games: [legacyGame] }, 1);

		await useGamesStore.persist.rehydrate();

		const [game] = useGamesStore.getState().games;
		expect(game.categories.map((c) => c.brick)).toEqual([
			{ kind: "manual", allowNegative: true, max: 50 },
			{ kind: "manual", allowNegative: false },
			{ kind: "tokens", tokens: [{ label: "Victoire", value: 1 }] },
		]);
		expect(readCopy("games-store-v1-avant-migration.json").state).toEqual({ games: [legacyGame] });
		expect((await readPersisted(AsyncStorage, "games-store")).version).toBe(GAMES_STORE_VERSION);
		expect(useDataIssuesStore.getState().issues).toEqual([]);
	});

	it("démarre sans joueurs écrits par une version plus récente, sans les perdre", async () => {
		const players = [makePlayer({ id: "futur" })];
		await writePersisted(AsyncStorage, "players-store", { players }, PLAYERS_STORE_VERSION + 1);

		await usePlayersStore.persist.rehydrate();

		expect(usePlayersStore.getState().players).toEqual([]);
		const name = `players-store-v${PLAYERS_STORE_VERSION + 1}-avant-migration.json`;
		expect(readCopy(name).state).toEqual({ players });
		expect(useDataIssuesStore.getState().issues).toEqual([
			{ storeName: "players-store", kind: "newer", copyUri: `file:///documents/secours/${name}` },
		]);
	});

	it("démarre sans jeux si l'un d'eux est abîmé, en gardant la copie brute", async () => {
		const games = [makeGame(), makeGame({ id: "abime", minPlayers: 5, maxPlayers: 2 })];
		await writePersisted(AsyncStorage, "games-store", { games }, GAMES_STORE_VERSION);

		await useGamesStore.persist.rehydrate();

		expect(useGamesStore.getState().games).toEqual([]);
		expect(readCopy(`games-store-v${GAMES_STORE_VERSION}-refuse.json`).state).toEqual({ games });
		expect(useDataIssuesStore.getState().issues[0]).toMatchObject({ kind: "invalid" });
	});

	it("reprend une partie en cours enregistrée avant l'ajout de l'étape courante", async () => {
		const legacy = {
			gameDefId: "game1",
			playerIds: ["p1"],
			entries: { p1: makeEntry("p1", { c1: 4 }) },
			startedAt: 1_000,
		};
		await writePersisted(AsyncStorage, "session-store", legacy, SESSION_STORE_VERSION);

		await useSessionStore.persist.rehydrate();

		expect(useSessionStore.getState()).toMatchObject({ ...legacy, currentCategoryId: null });
	});

	it("ignore une partie en cours aux scores illisibles", async () => {
		await writePersisted(
			AsyncStorage,
			"session-store",
			{ gameDefId: "game1", playerIds: ["p1"], entries: { p1: { scores: "12" } }, startedAt: 0 },
			SESSION_STORE_VERSION,
		);

		await useSessionStore.persist.rehydrate();

		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
	});

	it("revient au thème sombre sur un mode inconnu, sans alerte", async () => {
		await writePersisted(
			AsyncStorage,
			"theme-store",
			{ mode: "rose", backgrounds: {} },
			THEME_STORE_VERSION,
		);

		await useThemeStore.persist.rehydrate();

		expect(useThemeStore.getState().mode).toBe("dark");
		expect(useDataIssuesStore.getState().issues).toEqual([]);
	});
});
