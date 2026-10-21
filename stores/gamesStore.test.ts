import { readPersisted, writePersisted } from "@forthtilliath/test-kit/persistedState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GAMES_STORE_VERSION, migrateGamesStoreData, useGamesStore } from "@/stores/gamesStore";
import { makeCategory, makeGame } from "@/test/factories";

const manual = { kind: "manual", allowNegative: false } as const;

beforeEach(async () => {
	useGamesStore.setState({ games: [] });
	await AsyncStorage.clear();
	jest.spyOn(Date, "now").mockReturnValue(1_000);
});

afterEach(() => jest.restoreAllMocks());

describe("useGamesStore", () => {
	it("crée un jeu avec un id, un nom nettoyé et un id immuable par catégorie", () => {
		const game = useGamesStore.getState().addGame({
			name: "  Azul  ",
			categories: [
				{ label: "Murs", color: "#f00", brick: manual },
				{ label: "Bonus", color: "#0f0", brick: manual },
			],
			minPlayers: 2,
			maxPlayers: 4,
		});

		expect(game).toMatchObject({
			name: "Azul",
			minPlayers: 2,
			maxPlayers: 4,
			rounds: 1,
			createdAt: 1_000,
			isArchived: false,
		});
		expect(game.id).toEqual(expect.any(String));
		expect(game.categories.map((c) => c.label)).toEqual(["Murs", "Bonus"]);
		const categoryIds = game.categories.map((c) => c.id);
		expect(new Set(categoryIds).size).toBe(2);
		expect(useGamesStore.getState().games).toEqual([game]);
	});

	it("modifie un jeu sans toucher aux autres ni à son id/date de création", () => {
		const other = makeGame({ id: "autre", name: "Autre" });
		const game = makeGame({ id: "cible", createdAt: 42 });
		useGamesStore.setState({ games: [other, game] });

		const categories = [makeCategory({ id: "c1", label: "Renommée" })];
		useGamesStore.getState().updateGame("cible", {
			name: " Nouveau ",
			categories,
			minPlayers: 1,
			maxPlayers: 6,
			rounds: 3,
		});

		const [unchanged, updated] = useGamesStore.getState().games;
		expect(unchanged).toBe(other);
		expect(updated).toEqual({
			...game,
			name: "Nouveau",
			categories,
			minPlayers: 1,
			maxPlayers: 6,
			rounds: 3,
		});
	});

	it("archive puis désarchive un jeu sans jamais le supprimer", () => {
		useGamesStore.setState({ games: [makeGame({ id: "g" })] });
		useGamesStore.getState().toggleArchived("g");
		expect(useGamesStore.getState().games[0].isArchived).toBe(true);
		useGamesStore.getState().toggleArchived("g");
		expect(useGamesStore.getState().games[0].isArchived).toBe(false);
	});

	it("supprime un jeu sans toucher aux autres", () => {
		const other = makeGame({ id: "autre" });
		useGamesStore.setState({ games: [makeGame({ id: "g" }), other] });
		useGamesStore.getState().removeGame("g");
		expect(useGamesStore.getState().games).toEqual([other]);
	});

	it("remplace toute la liste", () => {
		const games = [makeGame({ id: "a" }), makeGame({ id: "b" })];
		useGamesStore.getState().replaceAll(games);
		expect(useGamesStore.getState().games).toBe(games);
	});
});

describe("persistance des jeux", () => {
	it("écrit sous la clé et la version attendues (les changer perdrait les données existantes)", async () => {
		useGamesStore
			.getState()
			.addGame({ name: "Azul", categories: [], minPlayers: 2, maxPlayers: 4 });

		const persisted = await readPersisted(AsyncStorage, "games-store");
		expect(persisted.version).toBe(2);
		expect(persisted.state).toEqual({ games: useGamesStore.getState().games });
	});

	it("recharge les jeux enregistrés par la version courante", async () => {
		const games = [makeGame({ id: "sauvegarde" })];
		await writePersisted(AsyncStorage, "games-store", { games }, GAMES_STORE_VERSION);

		await useGamesStore.persist.rehydrate();

		expect(useGamesStore.getState().games).toEqual(games);
	});
});

describe("migrateGamesStoreData", () => {
	it("garde l'état de la version courante tel quel", () => {
		const state = { games: [makeGame()] };
		expect(migrateGamesStoreData(state, GAMES_STORE_VERSION)).toBe(state);
	});

	// Conversion v1 → v2 et copie de secours : stores/rehydration.test.ts.
	it("démarre vide depuis une version sans conversion", () => {
		expect(migrateGamesStoreData({ games: [makeGame()] }, 0)).toEqual({ games: [] });
	});
});
