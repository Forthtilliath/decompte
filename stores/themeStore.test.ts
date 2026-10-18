import AsyncStorage from "@react-native-async-storage/async-storage";
import { migrateThemeStoreData, THEME_STORE_VERSION, useThemeStore } from "@/stores/themeStore";
import { readPersisted, writePersisted } from "@/test/persistence";

beforeEach(async () => {
	useThemeStore.setState({ mode: "dark" });
	await AsyncStorage.clear();
});

describe("useThemeStore", () => {
	it("est en mode sombre par défaut (apparence des installations existantes)", () => {
		expect(useThemeStore.getInitialState().mode).toBe("dark");
	});

	it("persiste le mode choisi", async () => {
		useThemeStore.getState().setMode("light");
		expect(await readPersisted("theme-store")).toEqual({ state: { mode: "light" }, version: 1 });
	});

	it("recharge le mode enregistré", async () => {
		await writePersisted("theme-store", { mode: "light" }, THEME_STORE_VERSION);
		await useThemeStore.persist.rehydrate();
		expect(useThemeStore.getState().mode).toBe("light");
	});

	it("revient au sombre pour une version inconnue", () => {
		expect(migrateThemeStoreData({ mode: "light" }, 0)).toEqual({ mode: "dark" });
	});
});
