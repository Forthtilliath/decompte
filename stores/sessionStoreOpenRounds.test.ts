import { useHistoryStore } from "@/stores/historyStore";
import { useSessionStore } from "@/stores/sessionStore";

// Partie en manches ouvertes (le reste du store : sessionStore.test.ts).

beforeEach(() => {
	useSessionStore.getState().resetSession();
	useHistoryStore.setState({ sessions: [] });
});

describe("useSessionStore en manches ouvertes", () => {
	it("compte les manches commencées et garde le seuil jusqu'à l'historique", () => {
		const store = useSessionStore.getState();
		store.startNewSession("odin", ["p1", "p2"], { openRounds: { scoreLimit: 15 } });
		expect(useSessionStore.getState().roundCount).toBe(1);

		store.setRoundCount(3);
		expect(useSessionStore.getState().roundCount).toBe(3);
		expect(store.toSession()).toMatchObject({ openRounds: { scoreLimit: 15 } });

		store.finishSession();
		expect(useHistoryStore.getState().sessions[0].openRounds).toEqual({ scoreLimit: 15 });
		expect(useSessionStore.getState()).toMatchObject({ openRounds: null, roundCount: null });
	});

	it("ignore le nombre de manches d'une partie à manches fixes", () => {
		const store = useSessionStore.getState();
		store.startNewSession("pixies", ["p1"]);
		store.setRoundCount(3);
		expect(useSessionStore.getState().roundCount).toBeNull();
		expect(store.toSession()).not.toHaveProperty("openRounds");
	});
});
