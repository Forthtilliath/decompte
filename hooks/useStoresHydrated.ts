import { useCallback, useSyncExternalStore } from "react";

/** Store Zustand persisté : seule sa relecture depuis AsyncStorage est observée. */
type PersistedStore = {
	persist: { hasHydrated: () => boolean; onFinishHydration: (listener: () => void) => () => void };
};

/** `true` une fois tous les `stores` relus. `stores` doit être stable (constante de module). */
export function useStoresHydrated(stores: readonly PersistedStore[]): boolean {
	const subscribe = useCallback(
		(onChange: () => void) => {
			const unsubscribers = stores.map((store) => store.persist.onFinishHydration(onChange));
			return () => {
				for (const unsubscribe of unsubscribers) unsubscribe();
			};
		},
		[stores],
	);
	const getSnapshot = () => stores.every((store) => store.persist.hasHydrated());
	return useSyncExternalStore(subscribe, getSnapshot);
}
