import { readPersisted, writePersisted } from "@forthtilliath/test-kit/persistedState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	HISTORY_STORE_VERSION,
	migrateHistoryStoreData,
	useHistoryStore,
} from "@/stores/historyStore";
import { makeSession } from "@/test/factories";

beforeEach(async () => {
	useHistoryStore.setState({ sessions: [] });
	await AsyncStorage.clear();
});

describe("useHistoryStore", () => {
	it("ajoute les parties en tête (la plus récente d'abord)", () => {
		const { addSession } = useHistoryStore.getState();
		addSession(makeSession({ id: "ancienne" }));
		addSession(makeSession({ id: "recente" }));
		expect(useHistoryStore.getState().sessions.map((s) => s.id)).toEqual(["recente", "ancienne"]);
	});

	it("supprime une partie", () => {
		useHistoryStore.setState({ sessions: [makeSession({ id: "a" }), makeSession({ id: "b" })] });
		useHistoryStore.getState().removeSession("a");
		expect(useHistoryStore.getState().sessions.map((s) => s.id)).toEqual(["b"]);
	});

	it("remplace tout l'historique", () => {
		const sessions = [makeSession({ id: "x" })];
		useHistoryStore.getState().replaceAll(sessions);
		expect(useHistoryStore.getState().sessions).toBe(sessions);
	});
});

describe("persistance de l'historique", () => {
	it("écrit sous la clé et la version attendues", async () => {
		useHistoryStore.getState().addSession(makeSession());
		const persisted = await readPersisted(AsyncStorage, "history-store");
		expect(persisted.version).toBe(1);
		expect(persisted.state).toEqual({ sessions: [makeSession()] });
	});

	it("recharge les parties enregistrées", async () => {
		const sessions = [makeSession({ id: "sauvegarde", finishedAt: 10 })];
		await writePersisted(AsyncStorage, "history-store", { sessions }, HISTORY_STORE_VERSION);
		await useHistoryStore.persist.rehydrate();
		expect(useHistoryStore.getState().sessions).toEqual(sessions);
	});

	it("réinitialise une version inconnue", () => {
		expect(migrateHistoryStoreData({ sessions: [makeSession()] }, 0)).toEqual({ sessions: [] });
	});
});
