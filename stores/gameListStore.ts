import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { GAME_SORT_ORDERS, type GameSortOrder } from "@/lib/gameSort";
import { validatedMerge } from "@/lib/persistedState";

type State = {
	sortOrder: GameSortOrder;
};

type Actions = {
	setSortOrder: (sortOrder: GameSortOrder) => void;
};

// Bump on any breaking change to State's shape.
export const GAME_LIST_STORE_VERSION = 1;

const gameListStateSchema = z.object({ sortOrder: z.enum(GAME_SORT_ORDERS) });

/** Préférences d'affichage de la liste des jeux (hors sauvegarde, comme le thème). */
export const useGameListStore = create<State & Actions>()(
	persist(
		(set) => ({
			sortOrder: "recent",

			setSortOrder: (sortOrder) => set({ sortOrder }),
		}),
		{
			name: "game-list-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: GAME_LIST_STORE_VERSION,
			merge: validatedMerge<State>(
				"game-list-store",
				GAME_LIST_STORE_VERSION,
				gameListStateSchema,
				{
					report: false,
				},
			),
		},
	),
);
