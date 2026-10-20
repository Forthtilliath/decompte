import AsyncStorage from "@react-native-async-storage/async-storage";
import type { z } from "zod";

/** Clé où l'état d'un store refusé à la relecture est mis de côté, tel quel. */
export function rejectedStateKey(storeName: string): string {
	return `${storeName}:refuse`;
}

/**
 * Option `merge` du middleware `persist` de Zustand : l'état relu d'AsyncStorage passe par `schema`
 * au lieu d'un simple cast. Ce sont les données de l'app elle-même, mais un stockage abîmé
 * (écriture interrompue, modification extérieure…) ne doit ni faire planter les écrans, ni passer
 * pour des données valides.
 *
 * Refusé, le store démarre vide et le contenu brut est gardé sous `rejectedStateKey(storeName)`,
 * puisque la prochaine modification réécrira la clé du store ; une copie déjà gardée n'est jamais
 * écrasée. Accepté, l'état est repris tel qu'enregistré : pas de suppression des clés inconnues,
 * un schéma en retard sur un type effacerait ce champ à chaque lancement.
 */
export function validatedMerge<P extends object>(storeName: string, schema: z.ZodType) {
	return <S extends P>(persisted: unknown, current: S): S => {
		if (persisted === undefined || persisted === null) return current;
		if (schema.safeParse(persisted).success) return { ...current, ...(persisted as P) };
		void keepRejectedState(storeName, persisted);
		return current;
	};
}

async function keepRejectedState(storeName: string, persisted: unknown): Promise<void> {
	const key = rejectedStateKey(storeName);
	try {
		if ((await AsyncStorage.getItem(key)) === null) {
			await AsyncStorage.setItem(key, JSON.stringify(persisted));
		}
	} catch {
		// Stockage inaccessible : il n'y a rien de plus à sauver.
	}
}
