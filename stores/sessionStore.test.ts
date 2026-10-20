import { readPersisted, writePersisted } from "@forthtilliath/test-kit/persistedState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useHistoryStore } from "@/stores/historyStore";
import {
	migrateSessionStoreData,
	SESSION_STORE_VERSION,
	useSessionStore,
} from "@/stores/sessionStore";

const EMPTY = {
	gameDefId: null,
	playerIds: [],
	entries: {},
	startedAt: null,
	currentCategoryId: null,
	currentRound: null,
};

const now = jest.spyOn(Date, "now");

beforeEach(async () => {
	useSessionStore.getState().resetSession();
	useHistoryStore.setState({ sessions: [] });
	await AsyncStorage.clear();
	now.mockReturnValue(1_000);
});

describe("useSessionStore", () => {
	it("n'a pas de partie en cours au départ", () => {
		expect(useSessionStore.getState()).toMatchObject(EMPTY);
		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
	});

	it("démarre une partie avec une feuille de score vide par joueur", () => {
		useSessionStore.getState().setCurrentCategory("ancienne-etape");
		useSessionStore.getState().startNewSession("azul", ["p1", "p2"]);

		expect(useSessionStore.getState()).toMatchObject({
			gameDefId: "azul",
			playerIds: ["p1", "p2"],
			entries: {
				p1: { playerId: "p1", scores: {} },
				p2: { playerId: "p2", scores: {} },
			},
			startedAt: 1_000,
			currentCategoryId: null,
			currentRound: null,
		});
		expect(useSessionStore.getState().hasOngoingSession()).toBe(true);
	});

	it("enregistre et corrige un score sans toucher aux autres", () => {
		const store = useSessionStore.getState();
		store.startNewSession("azul", ["p1", "p2"]);
		store.updateScore("p1", "murs", 12);
		store.updateScore("p1", "bonus", 3);
		store.updateScore("p1", "murs", 15);

		const { entries } = useSessionStore.getState();
		expect(entries.p1.scores).toEqual({ murs: 15, bonus: 3 });
		expect(entries.p2.scores).toEqual({});
	});

	it("ignore un score pour un joueur absent de la partie", () => {
		useSessionStore.getState().startNewSession("azul", ["p1"]);
		useSessionStore.getState().updateScore("intrus", "murs", 99);
		expect(Object.keys(useSessionStore.getState().entries)).toEqual(["p1"]);
	});

	it("change l'ordre des joueurs sans toucher à leurs scores", () => {
		const store = useSessionStore.getState();
		store.startNewSession("azul", ["p1", "p2", "p3"]);
		store.updateScore("p3", "murs", 7);
		store.movePlayer("p3", -1);
		store.movePlayer("p1", 1);

		expect(useSessionStore.getState().playerIds).toEqual(["p3", "p1", "p2"]);
		expect(useSessionStore.getState().entries.p3.scores).toEqual({ murs: 7 });
	});

	it("ignore un déplacement hors de la liste ou pour un joueur absent", () => {
		useSessionStore.getState().startNewSession("azul", ["p1", "p2"]);
		const before = useSessionStore.getState().playerIds;
		useSessionStore.getState().movePlayer("p1", -1);
		useSessionStore.getState().movePlayer("intrus", 1);
		expect(useSessionStore.getState().playerIds).toBe(before);
	});

	it("mémorise l'étape affichée et sa manche", () => {
		useSessionStore.getState().setCurrentCategory("c2");
		expect(useSessionStore.getState()).toMatchObject({ currentCategoryId: "c2", currentRound: 1 });
		useSessionStore.getState().setCurrentCategory("c1", 3);
		expect(useSessionStore.getState()).toMatchObject({ currentCategoryId: "c1", currentRound: 3 });
	});

	it("construit la partie sans la persister ni réinitialiser", () => {
		const store = useSessionStore.getState();
		store.startNewSession("azul", ["p1"]);
		store.updateScore("p1", "murs", 4);

		expect(useSessionStore.getState().toSession()).toEqual({
			id: expect.any(String),
			gameDefId: "azul",
			createdAt: 1_000,
			playerIds: ["p1"],
			entries: { p1: { playerId: "p1", scores: { murs: 4 } } },
		});
		expect(useHistoryStore.getState().sessions).toEqual([]);
		expect(useSessionStore.getState().hasOngoingSession()).toBe(true);
	});

	it("termine la partie : l'ajoute à l'historique avec sa date de fin puis repart de zéro", () => {
		const store = useSessionStore.getState();
		store.startNewSession("azul", ["p1", "p2"]);
		store.updateScore("p2", "murs", 8);
		now.mockReturnValue(9_000);

		useSessionStore.getState().finishSession();

		expect(useHistoryStore.getState().sessions).toEqual([
			{
				id: expect.any(String),
				gameDefId: "azul",
				createdAt: 1_000,
				finishedAt: 9_000,
				playerIds: ["p1", "p2"],
				entries: {
					p1: { playerId: "p1", scores: {} },
					p2: { playerId: "p2", scores: { murs: 8 } },
				},
			},
		]);
		expect(useSessionStore.getState()).toMatchObject(EMPTY);
	});

	it("abandonne la partie sans rien enregistrer", () => {
		useSessionStore.getState().startNewSession("azul", ["p1"]);
		useSessionStore.getState().resetSession();
		expect(useSessionStore.getState()).toMatchObject(EMPTY);
		expect(useHistoryStore.getState().sessions).toEqual([]);
	});
});

describe("persistance de la partie en cours", () => {
	it("écrit sous la clé et la version attendues, sans les fonctions", async () => {
		useSessionStore.getState().startNewSession("azul", ["p1"]);
		const persisted = await readPersisted(AsyncStorage, "session-store");
		expect(persisted.version).toBe(1);
		expect(persisted.state).toEqual({
			gameDefId: "azul",
			playerIds: ["p1"],
			entries: { p1: { playerId: "p1", scores: {} } },
			startedAt: 1_000,
			currentCategoryId: null,
			currentRound: null,
		});
	});

	it("reprend une partie interrompue (app fermée en cours de saisie)", async () => {
		await writePersisted(
			AsyncStorage,
			"session-store",
			{
				gameDefId: "azul",
				playerIds: ["p1"],
				entries: { p1: { playerId: "p1", scores: { murs: 6 } } },
				startedAt: 500,
				currentCategoryId: "murs",
			},
			SESSION_STORE_VERSION,
		);

		await useSessionStore.persist.rehydrate();

		expect(useSessionStore.getState()).toMatchObject({
			gameDefId: "azul",
			currentCategoryId: "murs",
			entries: { p1: { playerId: "p1", scores: { murs: 6 } } },
		});
		expect(useSessionStore.getState().hasOngoingSession()).toBe(true);
	});

	it("complète une partie enregistrée avant le suivi de l'étape (currentCategoryId absent)", async () => {
		await writePersisted(
			AsyncStorage,
			"session-store",
			{ gameDefId: "azul", playerIds: ["p1"], entries: {}, startedAt: 500 },
			SESSION_STORE_VERSION,
		);
		await useSessionStore.persist.rehydrate();
		expect(useSessionStore.getState().currentCategoryId).toBeNull();
		expect(useSessionStore.getState().currentRound).toBeNull();
		expect(useSessionStore.getState().gameDefId).toBe("azul");
	});

	it("réinitialise une version inconnue", () => {
		expect(migrateSessionStoreData({ gameDefId: "x" }, 0)).toEqual(EMPTY);
	});
});
