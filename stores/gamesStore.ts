import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { gameSchema, MAX_ENTITIES } from "@/lib/backupSchema";
import { createStoreMigrate, type MigrationSteps, validatedMerge } from "@/lib/persistedState";
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

// À incrémenter à tout changement incompatible de GameDef, en ajoutant son étape à GAMES_MIGRATIONS.
// v2 : ScoringBrick "manual" remplace `min` par `allowNegative`, ajout des kinds "choice"/"boolean".
export const GAMES_STORE_VERSION = 2;

/** Mêmes règles qu'une sauvegarde importée (lib/backupSchema). */
const gamesStateSchema = z.object({ games: z.array(gameSchema).max(MAX_ENTITIES) });

type LegacyState = { games: { categories: { brick: { kind: string; min?: number } }[] }[] };

/** Voir MigrationSteps. Une donnée de forme inattendue fait échouer l'étape : copie et alerte. */
export const GAMES_MIGRATIONS: MigrationSteps = {
	// v1 → v2 : un plancher négatif (`min`) devient `allowNegative`, les autres planchers étaient 0.
	1: (state) => ({
		games: (state as LegacyState).games.map((game) => ({
			...game,
			categories: game.categories.map((category) => {
				if (category.brick.kind !== "manual") return category;
				const { min, ...brick } = category.brick;
				return { ...category, brick: { ...brick, allowNegative: (min ?? 0) < 0 } };
			}),
		})),
	}),
};

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export const migrateGamesStoreData = createStoreMigrate<State>(
	"games-store",
	GAMES_STORE_VERSION,
	GAMES_MIGRATIONS,
	{ games: [] },
);

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
			merge: validatedMerge<State>("games-store", GAMES_STORE_VERSION, gamesStateSchema),
		},
	),
);
