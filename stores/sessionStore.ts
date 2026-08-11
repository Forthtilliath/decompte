import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createId } from "@/lib/uuid";
import { useHistoryStore } from "@/stores/historyStore";
import { createEmptySessionEntry, type Session, type SessionEntry } from "@/types/game";

type State = {
	gameDefId: string | null;
	playerIds: string[];
	entries: Record<string, SessionEntry>;
	startedAt: number | null;
};

type Actions = {
	startNewSession: (gameDefId: string, playerIds: string[]) => void;
	updateScore: (playerId: string, categoryId: string, points: number) => void;
	/** Construit l'objet Session correspondant à l'état courant, sans le persister. */
	toSession: () => Session;
	/** Enregistre la partie dans l'historique et réinitialise la partie en cours. */
	finishSession: () => void;
	resetSession: () => void;
	hasOngoingSession: () => boolean;
};

const EMPTY_STATE: State = { gameDefId: null, playerIds: [], entries: {}, startedAt: null };

// Bump on any breaking change to State's shape.
export const SESSION_STORE_VERSION = 1;

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export function migrateSessionStoreData(persistedState: unknown, version: number): State {
	return version === SESSION_STORE_VERSION ? (persistedState as State) : EMPTY_STATE;
}

export const useSessionStore = create<State & Actions>()(
	persist(
		(set, get) => ({
			...EMPTY_STATE,

			startNewSession: (gameDefId, playerIds) => {
				set({
					gameDefId,
					playerIds,
					entries: Object.fromEntries(playerIds.map((id) => [id, createEmptySessionEntry(id)])),
					startedAt: Date.now(),
				});
			},

			updateScore: (playerId, categoryId, points) => {
				const current = get().entries[playerId];
				if (!current) return;
				set({
					entries: {
						...get().entries,
						[playerId]: { ...current, scores: { ...current.scores, [categoryId]: points } },
					},
				});
			},

			toSession: () => {
				const state = get();
				return {
					id: createId(),
					gameDefId: state.gameDefId ?? "",
					createdAt: state.startedAt ?? Date.now(),
					playerIds: state.playerIds,
					entries: state.entries,
				};
			},

			finishSession: () => {
				const session = get().toSession();
				useHistoryStore.getState().addSession({ ...session, finishedAt: Date.now() });
				set(EMPTY_STATE);
			},

			resetSession: () => set(EMPTY_STATE),

			hasOngoingSession: () => get().playerIds.length > 0,
		}),
		{
			name: "session-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: SESSION_STORE_VERSION,
			migrate: migrateSessionStoreData,
		},
	),
);
