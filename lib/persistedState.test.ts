import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { createStoreMigrate, runMigrationSteps, validatedMerge } from "@/lib/persistedState";
import { rescueStorageKey } from "@/lib/rescueCopies";
import { useDataIssuesStore } from "@/stores/dataIssuesStore";
import { memoryFileSystem } from "@/test/fileSystem";

jest.mock("expo-file-system", () => require("@/test/fileSystem").createMemoryFileSystem());
jest.mock("@forthtilliath/react-native-kit/utils/files/appFiles", () =>
	jest.requireActual("@forthtilliath/react-native-kit/utils/files/appFiles"),
);

const RESCUE_DIRECTORY = "file:///documents/secours";
const memoryFiles = () => memoryFileSystem().store;
const readCopy = (name: string) =>
	JSON.parse(memoryFiles().get(`${RESCUE_DIRECTORY}/${name}`) ?? "null");
const issues = () => useDataIssuesStore.getState().issues;

/** Les écritures de secours dans AsyncStorage ne sont pas attendues : on les laisse finir. */
const flushStorage = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
	await AsyncStorage.clear();
	memoryFileSystem().reset();
	useDataIssuesStore.getState().clear();
});

describe("validatedMerge", () => {
	const merge = validatedMerge<{ count: number }>("test-store", 3, z.object({ count: z.number() }));
	const current = { count: 0, increment: () => {} };

	it("reprend un état valide tel qu'enregistré, sans toucher aux actions", () => {
		expect(merge({ count: 3 }, current)).toEqual({ ...current, count: 3 });
		expect(memoryFiles().size).toBe(0);
	});

	it("garde l'état initial quand rien n'est enregistré", async () => {
		expect(merge(undefined, current)).toBe(current);
		await flushStorage();
		expect(memoryFiles().size).toBe(0);
		expect(await AsyncStorage.getAllKeys()).toEqual([]);
	});

	it("refuse un état invalide, le garde en copie de secours et prévient l'utilisateur", () => {
		expect(merge({ count: "3" }, current)).toBe(current);
		expect(readCopy("test-store-v3-refuse.json")).toMatchObject({
			store: "test-store",
			version: 3,
			reason: "refuse",
			state: { count: "3" },
		});
		expect(issues()).toEqual([
			{
				storeName: "test-store",
				kind: "invalid",
				copyUri: `${RESCUE_DIRECTORY}/test-store-v3-refuse.json`,
			},
		]);
	});

	it("n'écrase jamais une copie déjà gardée, et ne prévient qu'une fois", () => {
		merge({ count: "premier" }, current);
		merge({ count: "second" }, current);
		expect(readCopy("test-store-v3-refuse.json").state).toEqual({ count: "premier" });
		expect(issues()).toHaveLength(1);
	});

	it("garde la copie dans AsyncStorage si le fichier ne peut pas être écrit", async () => {
		memoryFileSystem().failWrites = true;
		merge({ count: "3" }, current);
		await flushStorage();
		const kept = JSON.parse((await AsyncStorage.getItem(rescueStorageKey("test-store"))) ?? "");
		expect(kept.state).toEqual({ count: "3" });
		expect(issues()).toEqual([{ storeName: "test-store", kind: "invalid", copyUri: null }]);
	});

	it("garde la copie sans prévenir pour un réglage de l'appareil", () => {
		const settingsMerge = validatedMerge("reglage", 1, z.object({ count: z.number() }), {
			report: false,
		});
		settingsMerge({ count: "3" }, current);
		expect(readCopy("reglage-v1-refuse.json").state).toEqual({ count: "3" });
		expect(issues()).toEqual([]);
	});
});

describe("runMigrationSteps", () => {
	const steps = {
		1: (s: unknown) => [...(s as number[]), 2],
		2: (s: unknown) => [...(s as number[]), 3],
	};

	it("applique chaque étape dans l'ordre, depuis n'importe quelle version", () => {
		expect(runMigrationSteps([1], 1, 3, steps)).toEqual([1, 2, 3]);
		expect(runMigrationSteps([1, 2], 2, 3, steps)).toEqual([1, 2, 3]);
	});

	it("échoue s'il manque une étape ou si la version est plus récente", () => {
		expect(() => runMigrationSteps([], 0, 3, steps)).toThrow("version 0 à 1");
		expect(() => runMigrationSteps([], 4, 3, steps)).toThrow("plus récente");
	});
});

describe("createStoreMigrate", () => {
	const migrate = createStoreMigrate(
		"test-store",
		2,
		{ 1: (s) => ({ ...(s as object), b: 2 }) },
		{
			empty: true,
		},
	);

	it("garde une copie de l'état d'origine avant de le convertir", () => {
		expect(migrate({ a: 1 }, 1)).toEqual({ a: 1, b: 2 });
		expect(readCopy("test-store-v1-avant-migration.json").state).toEqual({ a: 1 });
		expect(issues()).toEqual([]);
	});

	it("démarre vide sans conversion possible, en gardant la copie et en prévenant", () => {
		expect(migrate({ a: 1 }, 0)).toEqual({ empty: true });
		expect(readCopy("test-store-v0-avant-migration.json").state).toEqual({ a: 1 });
		expect(issues()).toEqual([
			{
				storeName: "test-store",
				kind: "migration",
				copyUri: `${RESCUE_DIRECTORY}/test-store-v0-avant-migration.json`,
			},
		]);
	});

	it("signale des données d'une version plus récente de l'app", () => {
		expect(migrate({ a: 1 }, 3)).toEqual({ empty: true });
		expect(issues()[0].kind).toBe("newer");
	});

	it("traite une étape qui échoue comme une conversion impossible", () => {
		const failing = createStoreMigrate(
			"test-store",
			2,
			{
				1: () => {
					throw new Error("forme inattendue");
				},
			},
			{},
		);
		expect(failing({ a: 1 }, 1)).toEqual({});
		expect(issues()[0].kind).toBe("migration");
	});
});
