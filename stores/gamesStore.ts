import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { gameSchema, MAX_ENTITIES } from "@/lib/backupSchema";
import { createStoreMigrate, type MigrationSteps, validatedMerge } from "@/lib/persistedState";
import { createId } from "@/lib/uuid";
import type { CategoryDef, GameDef } from "@/types/game";

type State = {
	games: GameDef[];
};

type NewCategoryInput = Omit<CategoryDef, "id"> & { id?: string };

/** Options d'un jeu (règles de classement, équipes) : `false`/absent = désactivée. */
type GameOptions = Pick<GameDef, "lowestWins" | "tieBreakerId" | "teamPlay">;

/** Seules les options actives sont écrites : un jeu sans option garde la forme d'avant leur ajout. */
function gameOptions({ lowestWins, tieBreakerId, teamPlay }: GameOptions): GameOptions {
	return {
		...(lowestWins && { lowestWins: true }),
		...(tieBreakerId && { tieBreakerId }),
		...(teamPlay && { teamPlay: true }),
	};
}

type Actions = {
	addGame: (
		input: GameOptions & {
			name: string;
			categories: NewCategoryInput[];
			minPlayers: number;
			maxPlayers: number;
			rounds?: number;
		},
	) => GameDef;
	updateGame: (
		id: string,
		patch: GameOptions & {
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

			addGame: (input) => {
				const { name, categories, minPlayers, maxPlayers, rounds = 1 } = input;
				const game: GameDef = {
					id: createId(),
					name: name.trim(),
					// Chaque catégorie garde ici son id définitif et immuable (voir CategoryDef), reçu
					// du formulaire ou de l'import (le départage y fait déjà référence), créé sinon.
					categories: categories.map((c) => ({ ...c, id: c.id ?? createId() })),
					minPlayers,
					maxPlayers,
					rounds,
					createdAt: Date.now(),
					isArchived: false,
					...gameOptions(input),
				};
				set({ games: [...get().games, game] });
				return game;
			},

			updateGame: (id, patch) => {
				set({
					games: get().games.map((g) => {
						if (g.id !== id) return g;
						// Options retirées puis remises seulement si elles sont actives.
						const { lowestWins: _l, tieBreakerId: _t, teamPlay: _p, ...rest } = g;
						return {
							...rest,
							name: patch.name.trim(),
							categories: patch.categories,
							minPlayers: patch.minPlayers,
							maxPlayers: patch.maxPlayers,
							rounds: patch.rounds,
							...gameOptions(patch),
						};
					}),
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
