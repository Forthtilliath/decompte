import AsyncStorage from "@react-native-async-storage/async-storage";
import { migrateThemeStoreData, THEME_STORE_VERSION, useThemeStore } from "@/stores/themeStore";
import { readPersisted, writePersisted } from "@/test/persistence";

beforeEach(async () => {
	useThemeStore.setState({ mode: "dark", backgrounds: {} });
	await AsyncStorage.clear();
});

describe("useThemeStore", () => {
	it("est en mode sombre par défaut (apparence des installations existantes)", () => {
		expect(useThemeStore.getInitialState().mode).toBe("dark");
		expect(useThemeStore.getInitialState().backgrounds).toEqual({});
	});

	it("persiste le mode choisi", async () => {
		useThemeStore.getState().setMode("light");
		expect(await readPersisted("theme-store")).toEqual({
			state: { mode: "light", backgrounds: {} },
			version: THEME_STORE_VERSION,
		});
	});

	it("garde un fond par mode", () => {
		const { setBackground, setMode } = useThemeStore.getState();
		setBackground("tapis");
		setMode("light");
		setBackground("sauge");
		expect(useThemeStore.getState().backgrounds).toEqual({ dark: "tapis", light: "sauge" });
	});

	it("recharge le mode et les fonds enregistrés", async () => {
		await writePersisted(
			"theme-store",
			{ mode: "light", backgrounds: { light: "blanc" } },
			THEME_STORE_VERSION,
		);
		await useThemeStore.persist.rehydrate();
		expect(useThemeStore.getState().mode).toBe("light");
		expect(useThemeStore.getState().backgrounds).toEqual({ light: "blanc" });
	});

	it("garde le mode d'une sauvegarde v1, avec les fonds d'origine", () => {
		expect(migrateThemeStoreData({ mode: "light" }, 1)).toEqual({ mode: "light", backgrounds: {} });
	});

	it("revient au sombre pour une version inconnue ou un mode invalide", () => {
		expect(migrateThemeStoreData({ mode: "light" }, 0)).toEqual({ mode: "dark", backgrounds: {} });
		expect(migrateThemeStoreData({ mode: "rose" }, 1)).toEqual({ mode: "dark", backgrounds: {} });
		expect(migrateThemeStoreData(null, 1)).toEqual({ mode: "dark", backgrounds: {} });
	});
});
