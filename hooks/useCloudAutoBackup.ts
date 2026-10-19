import { useAutoBackup } from "@forthtilliath/expo-backup-ui/hooks";
import { useEffect } from "react";
import { backup } from "@/lib/backup";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";

/** Store persisté dont une tranche de l'état fait partie de la sauvegarde. */
type WatchedStore<S> = {
	subscribe: (listener: (state: S, prev: S) => void) => () => void;
	persist: { hasHydrated: () => boolean };
};

function watch<S>(store: WatchedStore<S>, select: (state: S) => unknown) {
	return store.subscribe((state, prev) => {
		// La réhydratation depuis AsyncStorage passe aussi par setState : seules les vraies
		// modifications comptent, une fois les données chargées.
		if (select(state) !== select(prev) && store.persist.hasHydrated()) {
			backup.notifyDataChanged();
		}
	});
}

/**
 * Sauvegarde automatique sur Google Drive une fois le compte relié : démarre le gestionnaire
 * (envoi en attente retenté au démarrage et au retour dans l'app) et lui signale chaque
 * modification des jeux, joueurs, groupes et parties. À monter une seule fois, dans le layout racine.
 */
export function useCloudAutoBackup() {
	useAutoBackup(backup);

	useEffect(() => {
		const unsubscribers = [
			watch(useGamesStore, (s) => s.games),
			watch(usePlayersStore, (s) => s.players),
			watch(useGroupsStore, (s) => s.groups),
			watch(useHistoryStore, (s) => s.sessions),
		];
		return () => {
			for (const unsubscribe of unsubscribers) unsubscribe();
		};
	}, []);
}
