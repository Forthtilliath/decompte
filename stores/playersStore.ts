import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { pruneAvatarPhotos } from "@/lib/avatarPhotos";
import { MAX_ENTITIES, playerSchema } from "@/lib/backupSchema";
import { createStoreMigrate, type MigrationSteps, validatedMerge } from "@/lib/persistedState";
import { createId } from "@/lib/uuid";
import type { Player } from "@/types/player";

type State = {
	players: Player[];
};

type Actions = {
	addPlayer: (input: { id?: string; name: string; avatarUri?: string }) => Player;
	updatePlayer: (id: string, patch: Partial<Omit<Player, "id" | "createdAt">>) => void;
	removePlayer: (id: string) => void;
	toggleFavorite: (id: string) => void;
	toggleArchived: (id: string) => void;
	replaceAll: (players: Player[]) => void;
};

// À incrémenter à tout changement incompatible de Player, en ajoutant son étape à PLAYERS_MIGRATIONS.
export const PLAYERS_STORE_VERSION = 1;

/** Mêmes règles qu'une sauvegarde importée (lib/backupSchema). */
const playersStateSchema = z.object({ players: z.array(playerSchema).max(MAX_ENTITIES) });

/** Voir MigrationSteps : aucune étape tant que la version 1 est la seule. */
export const PLAYERS_MIGRATIONS: MigrationSteps = {};

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export const migratePlayersStoreData = createStoreMigrate<State>(
	"players-store",
	PLAYERS_STORE_VERSION,
	PLAYERS_MIGRATIONS,
	{ players: [] },
);

export const usePlayersStore = create<State & Actions>()(
	persist(
		(set, get) => ({
			players: [],

			// `id` optionnel : passé par l'écran de création pour que la couleur d'avatar déjà
			// affichée pendant la saisie (dérivée de cet id) reste exactement la même une fois le
			// joueur créé, au lieu de sauter sur une nouvelle couleur.
			addPlayer: ({ id, name, avatarUri }) => {
				const player: Player = {
					id: id ?? createId(),
					name: name.trim(),
					avatarUri,
					isFavorite: false,
					isArchived: false,
					createdAt: Date.now(),
				};
				set({ players: [...get().players, player] });
				return player;
			},

			updatePlayer: (id, patch) => {
				set({
					players: get().players.map((p) => (p.id === id ? { ...p, ...patch } : p)),
				});
			},

			removePlayer: (id) => {
				set({ players: get().players.filter((p) => p.id !== id) });
			},

			toggleFavorite: (id) => {
				set({
					players: get().players.map((p) =>
						p.id === id ? { ...p, isFavorite: !p.isFavorite } : p,
					),
				});
			},

			toggleArchived: (id) => {
				set({
					players: get().players.map((p) =>
						p.id === id ? { ...p, isArchived: !p.isArchived } : p,
					),
				});
			},

			replaceAll: (players) => set({ players }),
		}),
		{
			name: "players-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: PLAYERS_STORE_VERSION,
			migrate: migratePlayersStoreData,
			merge: validatedMerge<State>("players-store", PLAYERS_STORE_VERSION, playersStateSchema),
			// Une fois les joueurs connus, et seulement au lancement : aucun formulaire n'est encore
			// ouvert, donc aucune photo tout juste choisie ne risque d'être prise pour un reste.
			onRehydrateStorage: () => (state) => {
				if (state) pruneAvatarPhotos(state.players);
			},
		},
	),
);

/** Joueurs triés : favoris puis actifs puis archivés, par ordre alphabétique dans chaque groupe. */
export function selectSortedPlayers(players: Player[]): Player[] {
	return [...players].sort((a, b) => {
		if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
		if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}
