import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Suivi de la vérification automatique des mises à jour (bandeau de l'onglet Jeux). Pas inclus
// dans les sauvegardes : propre à cet appareil et à la version installée.

type State = {
	/** Dernière vérification auprès de GitHub, réussie ou non : limite les appels au lancement. */
	lastCheckedAt: number | null;
	/** Version annoncée que l'utilisateur a choisi d'ignorer : plus jamais proposée par le bandeau. */
	dismissedVersion: string | null;
};

type Actions = {
	setLastCheckedAt: (at: number) => void;
	dismissVersion: (version: string) => void;
};

// Bump on any breaking change to State's shape.
export const UPDATE_STORE_VERSION = 1;

export const useUpdateStore = create<State & Actions>()(
	persist(
		(set) => ({
			lastCheckedAt: null,
			dismissedVersion: null,

			setLastCheckedAt: (at) => set({ lastCheckedAt: at }),
			dismissVersion: (version) => set({ dismissedVersion: version }),
		}),
		{
			name: "update-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: UPDATE_STORE_VERSION,
		},
	),
);

/** `true` une fois l'état enregistré relu : avant, la vérification ignorerait le délai et la version ignorée. */
export function useUpdateStoreHydrated(): boolean {
	return useSyncExternalStore(
		useUpdateStore.persist.onFinishHydration,
		useUpdateStore.persist.hasHydrated,
	);
}
