import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { validatedMerge } from "@/lib/persistedState";

export type ThemeMode = "dark" | "light";

type State = {
	mode: ThemeMode;
	/** Fond choisi pour chaque mode (identifiant de PAGE_BACKGROUNDS), gardé en changeant de mode. */
	backgrounds: Partial<Record<ThemeMode, string>>;
};

type Actions = {
	setMode: (mode: ThemeMode) => void;
	/** Change le fond du mode actuellement affiché. */
	setBackground: (backgroundId: string) => void;
};

// Bump on any breaking change to State's shape.
export const THEME_STORE_VERSION = 2;

const backgroundIdSchema = z.string().max(64).optional();
const themeStateSchema = z.object({
	mode: z.enum(["dark", "light"]),
	backgrounds: z.object({ dark: backgroundIdSchema, light: backgroundIdSchema }),
});

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export function migrateThemeStoreData(persistedState: unknown, version: number): State {
	const mode = (persistedState as Partial<State> | null)?.mode;
	// v1 n'avait que le mode : on le garde, avec les fonds d'origine.
	if (version === 1 && (mode === "dark" || mode === "light")) return { mode, backgrounds: {} };
	return version === THEME_STORE_VERSION
		? (persistedState as State)
		: { mode: "dark", backgrounds: {} };
}

export const useThemeStore = create<State & Actions>()(
	persist(
		(set) => ({
			// Sombre par défaut : c'était l'unique thème avant l'ajout du mode clair, on ne change
			// pas l'apparence des installations existantes sans action explicite de l'utilisateur.
			mode: "dark",
			backgrounds: {},

			setMode: (mode) => set({ mode }),
			setBackground: (backgroundId) =>
				set((s) => ({ backgrounds: { ...s.backgrounds, [s.mode]: backgroundId } })),
		}),
		{
			name: "theme-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: THEME_STORE_VERSION,
			migrate: migrateThemeStoreData,
			merge: validatedMerge<State>("theme-store", THEME_STORE_VERSION, themeStateSchema, {
				report: false,
			}),
		},
	),
);
