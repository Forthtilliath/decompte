import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createId } from "@/lib/uuid";
import type { CategoryDef, GameDef, ScoringBrick } from "@/types/game";

type State = {
	games: GameDef[];
};

type NewCategoryInput = { label: string; color: string; brick: ScoringBrick };

type Actions = {
	addGame: (input: {
		name: string;
		categories: NewCategoryInput[];
		minPlayers: number;
		maxPlayers: number;
		rounds?: number;
	}) => GameDef;
	updateGame: (
		id: string,
		patch: {
			name: string;
			categories: CategoryDef[];
			minPlayers: number;
			maxPlayers: number;
			rounds: number;
		},
	) => void;
	toggleArchived: (id: string) => void;
	replaceAll: (games: GameDef[]) => void;
};

// Bump on any breaking change to GameDef's shape.
// v2 : ScoringBrick "manual" remplace `min` par `allowNegative`, ajout des kinds "choice"/"boolean".
export const GAMES_STORE_VERSION = 2;

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export function migrateGamesStoreData(persistedState: unknown, version: number): State {
	return version === GAMES_STORE_VERSION ? (persistedState as State) : { games: [] };
}

export const useGamesStore = create<State & Actions>()(
	persist(
		(set, get) => ({
			games: [],

			addGame: ({ name, categories, minPlayers, maxPlayers, rounds = 1 }) => {
				const game: GameDef = {
					id: createId(),
					name: name.trim(),
					// Chaque catégorie reçoit ici son id définitif et immuable (voir CategoryDef).
					categories: categories.map((c) => ({ ...c, id: createId() })),
					minPlayers,
					maxPlayers,
					rounds,
					createdAt: Date.now(),
					isArchived: false,
				};
				set({ games: [...get().games, game] });
				return game;
			},

			updateGame: (id, patch) => {
				set({
					games: get().games.map((g) =>
						g.id === id
							? {
									...g,
									name: patch.name.trim(),
									categories: patch.categories,
									minPlayers: patch.minPlayers,
									maxPlayers: patch.maxPlayers,
									rounds: patch.rounds,
								}
							: g,
					),
				});
			},

			toggleArchived: (id) => {
				set({
					games: get().games.map((g) => (g.id === id ? { ...g, isArchived: !g.isArchived } : g)),
				});
			},

			replaceAll: (games) => set({ games }),
		}),
		{
			name: "games-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: GAMES_STORE_VERSION,
			migrate: migrateGamesStoreData,
		},
	),
);
