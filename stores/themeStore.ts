import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ThemeMode = "dark" | "light";

type State = {
	mode: ThemeMode;
};

type Actions = {
	setMode: (mode: ThemeMode) => void;
};

// Bump on any breaking change to State's shape.
export const THEME_STORE_VERSION = 1;

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export function migrateThemeStoreData(persistedState: unknown, version: number): State {
	return version === THEME_STORE_VERSION ? (persistedState as State) : { mode: "dark" };
}

export const useThemeStore = create<State & Actions>()(
	persist(
		(set) => ({
			// Sombre par défaut : c'était l'unique thème avant l'ajout du mode clair, on ne change
			// pas l'apparence des installations existantes sans action explicite de l'utilisateur.
			mode: "dark",

			setMode: (mode) => set({ mode }),
		}),
		{
			name: "theme-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: THEME_STORE_VERSION,
			migrate: migrateThemeStoreData,
		},
	),
);
