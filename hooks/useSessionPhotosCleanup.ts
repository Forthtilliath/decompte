import { usePersistHydrated } from "@forthtilliath/react-native-kit/hooks/usePersistHydrated";
import { useEffect } from "react";
import { pruneSessionPhotos } from "@/lib/sessionPhotos";
import { useHistoryStore } from "@/stores/historyStore";
import { useSessionStore } from "@/stores/sessionStore";

const PHOTO_STORES = [useHistoryStore, useSessionStore];

/**
 * Supprime au lancement les photos de parties devenues inutiles (lib/sessionPhotos), une fois
 * l'historique et la partie en cours relus : avant, la photo de la partie en cours semblerait
 * orpheline. À monter une seule fois, dans le layout racine.
 */
export function useSessionPhotosCleanup() {
	const hydrated = usePersistHydrated(PHOTO_STORES);

	useEffect(() => {
		if (!hydrated) return;
		const { photoUri } = useSessionStore.getState();
		pruneSessionPhotos([
			...useHistoryStore.getState().sessions,
			{ photoUri: photoUri ?? undefined },
		]);
	}, [hydrated]);
}
