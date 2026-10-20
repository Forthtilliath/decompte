import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { rejectedStateKey, validatedMerge } from "@/lib/persistedState";
import { GAMES_STORE_VERSION, useGamesStore } from "@/stores/gamesStore";
import { SESSION_STORE_VERSION, useSessionStore } from "@/stores/sessionStore";
import { THEME_STORE_VERSION, useThemeStore } from "@/stores/themeStore";
import { makeEntry, makeGame } from "@/test/factories";
import { writePersisted } from "@/test/persistence";

const merge = validatedMerge<{ count: number }>("test-store", z.object({ count: z.number() }));
const current = { count: 0, increment: () => {} };

/** Les écritures de la copie refusée ne sont pas attendues par `merge` : on les laisse finir. */
const flushStorage = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
	await AsyncStorage.clear();
});

describe("validatedMerge", () => {
	it("reprend un état valide tel qu'enregistré, sans toucher aux actions", () => {
		expect(merge({ count: 3 }, current)).toEqual({ ...current, count: 3 });
	});

	it("garde l'état initial quand rien n'est enregistré", async () => {
		expect(merge(undefined, current)).toBe(current);
		await flushStorage();
		expect(await AsyncStorage.getAllKeys()).toEqual([]);
	});

	it("refuse un état invalide et le met de côté tel quel", async () => {
		expect(merge({ count: "3" }, current)).toBe(current);
		await flushStorage();
		expect(JSON.parse((await AsyncStorage.getItem(rejectedStateKey("test-store"))) ?? "")).toEqual({
			count: "3",
		});
	});

	it("n'écrase jamais une copie déjà mise de côté", async () => {
		merge({ count: "premier" }, current);
		await flushStorage();
		merge({ count: "second" }, current);
		await flushStorage();
		expect(await AsyncStorage.getItem(rejectedStateKey("test-store"))).toBe('{"count":"premier"}');
	});
});

describe("relecture des stores", () => {
	beforeEach(() => {
		useGamesStore.setState({ games: [] });
		useSessionStore.getState().resetSession();
	});

	it("recharge des jeux valides", async () => {
		const games = [makeGame()];
		await writePersisted("games-store", { games }, GAMES_STORE_VERSION);

		await useGamesStore.persist.rehydrate();

		expect(useGamesStore.getState().games).toEqual(games);
	});

	it("démarre sans jeux si l'un d'eux est abîmé, en gardant la copie brute", async () => {
		const games = [makeGame(), makeGame({ id: "abime", minPlayers: 5, maxPlayers: 2 })];
		await writePersisted("games-store", { games }, GAMES_STORE_VERSION);

		await useGamesStore.persist.rehydrate();
		await flushStorage();

		expect(useGamesStore.getState().games).toEqual([]);
		expect(JSON.parse((await AsyncStorage.getItem("games-store:refuse")) ?? "")).toEqual({ games });
	});

	it("reprend une partie en cours enregistrée avant l'ajout de l'étape courante", async () => {
		const legacy = {
			gameDefId: "game1",
			playerIds: ["p1"],
			entries: { p1: makeEntry("p1", { c1: 4 }) },
			startedAt: 1_000,
		};
		await writePersisted("session-store", legacy, SESSION_STORE_VERSION);

		await useSessionStore.persist.rehydrate();

		expect(useSessionStore.getState()).toMatchObject({ ...legacy, currentCategoryId: null });
	});

	it("ignore une partie en cours aux scores illisibles", async () => {
		await writePersisted(
			"session-store",
			{ gameDefId: "game1", playerIds: ["p1"], entries: { p1: { scores: "12" } }, startedAt: 0 },
			SESSION_STORE_VERSION,
		);

		await useSessionStore.persist.rehydrate();

		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
	});

	it("revient au thème sombre sur un mode inconnu", async () => {
		await writePersisted("theme-store", { mode: "rose", backgrounds: {} }, THEME_STORE_VERSION);

		await useThemeStore.persist.rehydrate();

		expect(useThemeStore.getState().mode).toBe("dark");
	});
});
