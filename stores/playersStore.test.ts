import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	migratePlayersStoreData,
	PLAYERS_STORE_VERSION,
	selectSortedPlayers,
	usePlayersStore,
} from "@/stores/playersStore";
import { makePlayer } from "@/test/factories";
import { readPersisted, writePersisted } from "@/test/persistence";

beforeEach(async () => {
	usePlayersStore.setState({ players: [] });
	await AsyncStorage.clear();
	jest.spyOn(Date, "now").mockReturnValue(5_000);
});

afterEach(() => jest.restoreAllMocks());

describe("usePlayersStore", () => {
	it("crée un joueur au nom nettoyé, ni favori ni archivé", () => {
		const player = usePlayersStore
			.getState()
			.addPlayer({ name: "  Alice ", avatarUri: "file://a" });
		expect(player).toEqual({
			id: expect.any(String),
			name: "Alice",
			avatarUri: "file://a",
			isFavorite: false,
			isArchived: false,
			createdAt: 5_000,
		});
		expect(usePlayersStore.getState().players).toEqual([player]);
	});

	it("réutilise l'id fourni (couleur d'avatar déjà affichée pendant la saisie)", () => {
		const player = usePlayersStore.getState().addPlayer({ id: "pre-genere", name: "Bob" });
		expect(player.id).toBe("pre-genere");
	});

	it("modifie seulement le joueur ciblé", () => {
		usePlayersStore.setState({
			players: [makePlayer({ id: "a", name: "A" }), makePlayer({ id: "b", name: "B" })],
		});
		usePlayersStore.getState().updatePlayer("b", { name: "Béa", avatarUri: "file://b" });
		expect(usePlayersStore.getState().players).toEqual([
			makePlayer({ id: "a", name: "A" }),
			makePlayer({ id: "b", name: "Béa", avatarUri: "file://b" }),
		]);
	});

	it("bascule favori et archivage", () => {
		usePlayersStore.setState({ players: [makePlayer({ id: "a" })] });
		const { toggleFavorite, toggleArchived } = usePlayersStore.getState();
		toggleFavorite("a");
		toggleArchived("a");
		expect(usePlayersStore.getState().players[0]).toMatchObject({
			isFavorite: true,
			isArchived: true,
		});
		toggleFavorite("a");
		expect(usePlayersStore.getState().players[0].isFavorite).toBe(false);
	});

	it("supprime un joueur", () => {
		usePlayersStore.setState({ players: [makePlayer({ id: "a" }), makePlayer({ id: "b" })] });
		usePlayersStore.getState().removePlayer("a");
		expect(usePlayersStore.getState().players.map((p) => p.id)).toEqual(["b"]);
	});
});

describe("selectSortedPlayers", () => {
	it("trie favoris, puis actifs, puis archivés, par ordre alphabétique", () => {
		const players = [
			makePlayer({ id: "1", name: "Zoé" }),
			makePlayer({ id: "2", name: "Yann", isArchived: true }),
			makePlayer({ id: "3", name: "Bob", isFavorite: true }),
			makePlayer({ id: "4", name: "Alice" }),
			makePlayer({ id: "5", name: "Ana", isFavorite: true, isArchived: true }),
			makePlayer({ id: "6", name: "Élodie" }),
		];
		expect(selectSortedPlayers(players).map((p) => p.name)).toEqual([
			"Bob",
			"Alice",
			"Élodie",
			"Zoé",
			"Ana",
			"Yann",
		]);
	});

	it("ne modifie pas le tableau du store", () => {
		const players = [makePlayer({ name: "B" }), makePlayer({ name: "A" })];
		selectSortedPlayers(players);
		expect(players.map((p) => p.name)).toEqual(["B", "A"]);
	});
});

describe("persistance des joueurs", () => {
	it("écrit sous la clé et la version attendues", async () => {
		usePlayersStore.getState().addPlayer({ name: "Alice" });
		const persisted = await readPersisted("players-store");
		expect(persisted.version).toBe(1);
		expect(persisted.state).toEqual({ players: usePlayersStore.getState().players });
	});

	it("recharge les joueurs enregistrés", async () => {
		const players = [makePlayer({ id: "sauvegarde" })];
		await writePersisted("players-store", { players }, PLAYERS_STORE_VERSION);
		await usePlayersStore.persist.rehydrate();
		expect(usePlayersStore.getState().players).toEqual(players);
	});

	it("réinitialise une version inconnue", () => {
		expect(migratePlayersStoreData({ players: [makePlayer()] }, 0)).toEqual({ players: [] });
	});
});
