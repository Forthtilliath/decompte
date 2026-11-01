import { writePersisted } from "@forthtilliath/test-kit/persistedState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_NOTES_LENGTH } from "@/lib/gameLimits";
import { useHistoryStore } from "@/stores/historyStore";
import { SESSION_STORE_VERSION, useSessionStore } from "@/stores/sessionStore";

// Notes et photo ajoutées au classement final (le reste du store : sessionStore.test.ts).

const PHOTO = "file:///documents/parties/partie-1.jpg";

beforeEach(async () => {
	useSessionStore.getState().resetSession();
	useHistoryStore.setState({ sessions: [] });
	await AsyncStorage.clear();
});

describe("notes et photo de la partie en cours", () => {
	it("les reporte dans l'historique, notes nettoyées, puis les oublie", () => {
		const store = useSessionStore.getState();
		store.startNewSession("azul", ["p1"]);
		store.setExtras({ notes: "  Extension Pavillon  ", photoUri: PHOTO });

		store.finishSession();

		expect(useHistoryStore.getState().sessions[0]).toMatchObject({
			notes: "Extension Pavillon",
			photoUri: PHOTO,
		});
		expect(useSessionStore.getState()).toMatchObject({ notes: null, photoUri: null });
	});

	it("n'ajoute rien à l'historique quand elles sont vides ou retirées", () => {
		const store = useSessionStore.getState();
		store.startNewSession("azul", ["p1"]);
		store.setExtras({ notes: "Brouillon", photoUri: PHOTO });
		store.setExtras({ notes: "   ", photoUri: undefined });

		store.finishSession();

		const [session] = useHistoryStore.getState().sessions;
		expect(session).not.toHaveProperty("notes");
		expect(session).not.toHaveProperty("photoUri");
	});

	it("ne les reprend pas dans une nouvelle partie", () => {
		const store = useSessionStore.getState();
		store.startNewSession("azul", ["p1"]);
		store.setExtras({ notes: "Ancienne", photoUri: PHOTO });
		store.startNewSession("azul", ["p1"]);
		expect(useSessionStore.getState()).toMatchObject({ notes: null, photoUri: null });
	});

	it("les retrouve après une fermeture de l'app", async () => {
		const persisted = {
			gameDefId: "azul",
			playerIds: ["p1"],
			entries: { p1: { playerId: "p1", scores: {} } },
			startedAt: 1_000,
			notes: "Revanche",
			photoUri: PHOTO,
		};
		await writePersisted(AsyncStorage, "session-store", persisted, SESSION_STORE_VERSION);

		await useSessionStore.persist.rehydrate();

		expect(useSessionStore.getState()).toMatchObject({ notes: "Revanche", photoUri: PHOTO });
	});

	it("ignore une partie en cours aux notes trop longues", async () => {
		const persisted = {
			gameDefId: "azul",
			playerIds: ["p1"],
			entries: { p1: { playerId: "p1", scores: {} } },
			startedAt: 1_000,
			notes: "x".repeat(MAX_NOTES_LENGTH + 1),
		};
		await writePersisted(AsyncStorage, "session-store", persisted, SESSION_STORE_VERSION);

		await useSessionStore.persist.rehydrate();

		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
	});
});
