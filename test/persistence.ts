import AsyncStorage from "@react-native-async-storage/async-storage";

/** Contenu brut tel qu'écrit sur l'appareil par le middleware `persist` de Zustand. */
export async function readPersisted(key: string): Promise<{ state: unknown; version: number }> {
	const raw = await AsyncStorage.getItem(key);
	if (raw === null) throw new Error(`Rien n'est persisté sous la clé "${key}"`);
	return JSON.parse(raw);
}

/** Simule les données laissées sur l'appareil par une version précédente de l'app. */
export async function writePersisted(key: string, state: unknown, version: number): Promise<void> {
	await AsyncStorage.setItem(key, JSON.stringify({ state, version }));
}
