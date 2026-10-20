import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { groupSchema, MAX_ENTITIES } from "@/lib/backupSchema";
import { validatedMerge } from "@/lib/persistedState";
import { createId } from "@/lib/uuid";
import type { PlayerGroup } from "@/types/player";

type State = {
	groups: PlayerGroup[];
};

type Actions = {
	addGroup: (input: { name: string; playerIds: string[] }) => PlayerGroup;
	updateGroup: (id: string, patch: { name: string; playerIds: string[] }) => void;
	removeGroup: (id: string) => void;
	/** Retire un joueur supprimé de tous les groupes, pour ne pas y laisser d'id orphelin. */
	removePlayerFromGroups: (playerId: string) => void;
	toggleFavorite: (id: string) => void;
	toggleArchived: (id: string) => void;
	replaceAll: (groups: PlayerGroup[]) => void;
};

// Bump on any breaking change to PlayerGroup's shape.
export const GROUPS_STORE_VERSION = 1;

/** Mêmes règles qu'une sauvegarde importée (lib/backupSchema). */
const groupsStateSchema = z.object({ groups: z.array(groupSchema).max(MAX_ENTITIES) });

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export function migrateGroupsStoreData(persistedState: unknown, version: number): State {
	return version === GROUPS_STORE_VERSION ? (persistedState as State) : { groups: [] };
}

export const useGroupsStore = create<State & Actions>()(
	persist(
		(set, get) => ({
			groups: [],

			addGroup: ({ name, playerIds }) => {
				const group: PlayerGroup = {
					id: createId(),
					name: name.trim(),
					playerIds,
					isFavorite: false,
					isArchived: false,
					createdAt: Date.now(),
				};
				set({ groups: [...get().groups, group] });
				return group;
			},

			updateGroup: (id, patch) => {
				set({
					groups: get().groups.map((g) =>
						g.id === id ? { ...g, name: patch.name.trim(), playerIds: patch.playerIds } : g,
					),
				});
			},

			removeGroup: (id) => {
				set({ groups: get().groups.filter((g) => g.id !== id) });
			},

			removePlayerFromGroups: (playerId) => {
				set({
					groups: get().groups.map((g) =>
						g.playerIds.includes(playerId)
							? { ...g, playerIds: g.playerIds.filter((id) => id !== playerId) }
							: g,
					),
				});
			},

			toggleFavorite: (id) => {
				set({
					groups: get().groups.map((g) => (g.id === id ? { ...g, isFavorite: !g.isFavorite } : g)),
				});
			},

			toggleArchived: (id) => {
				set({
					groups: get().groups.map((g) => (g.id === id ? { ...g, isArchived: !g.isArchived } : g)),
				});
			},

			replaceAll: (groups) => set({ groups }),
		}),
		{
			name: "groups-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: GROUPS_STORE_VERSION,
			migrate: migrateGroupsStoreData,
			merge: validatedMerge<State>("groups-store", groupsStateSchema),
		},
	),
);

/** Groupes triés : favoris puis actifs puis archivés, par ordre alphabétique dans chaque groupe. */
export function selectSortedGroups(groups: PlayerGroup[]): PlayerGroup[] {
	return [...groups].sort((a, b) => {
		if (a.isArchived !== b.isArchived) return a.isArchived ? 1 : -1;
		if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
}
