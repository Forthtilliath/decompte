import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_SESSIONS, sessionSchema } from "@/lib/backupSchema";
import { createStoreMigrate, type MigrationSteps, validatedMerge } from "@/lib/persistedState";
import type { Session } from "@/types/game";

type State = {
	sessions: Session[];
};

type Actions = {
	addSession: (session: Session) => void;
	removeSession: (id: string) => void;
	replaceAll: (sessions: Session[]) => void;
};

// À incrémenter à tout changement incompatible de Session, en ajoutant son étape à HISTORY_MIGRATIONS.
export const HISTORY_STORE_VERSION = 1;

/** Mêmes règles qu'une sauvegarde importée (lib/backupSchema). */
const historyStateSchema = z.object({ sessions: z.array(sessionSchema).max(MAX_SESSIONS) });

/** Voir MigrationSteps : aucune étape tant que la version 1 est la seule. */
export const HISTORY_MIGRATIONS: MigrationSteps = {};

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export const migrateHistoryStoreData = createStoreMigrate<State>(
	"history-store",
	HISTORY_STORE_VERSION,
	HISTORY_MIGRATIONS,
	{ sessions: [] },
);

export const useHistoryStore = create<State & Actions>()(
	persist(
		(set, get) => ({
			sessions: [],

			addSession: (session) => set({ sessions: [session, ...get().sessions] }),

			removeSession: (id) => {
				set({ sessions: get().sessions.filter((s) => s.id !== id) });
			},

			replaceAll: (sessions) => set({ sessions }),
		}),
		{
			name: "history-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: HISTORY_STORE_VERSION,
			migrate: migrateHistoryStoreData,
			merge: validatedMerge<State>("history-store", HISTORY_STORE_VERSION, historyStateSchema),
		},
	),
);
