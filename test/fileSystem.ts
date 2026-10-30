import {
	createFakeExpoFileSystem,
	getFakeExpoFileSystem,
} from "@forthtilliath/expo-test-kit/file-system/createFakeExpoFileSystem";

/**
 * `expo-file-system` en mémoire (expo-test-kit), avec les URI complètes de l'app, pour les tests
 * qui écrivent puis relisent de vrais fichiers :
 *
 *     jest.mock("expo-file-system", () => require("@/test/fileSystem").createMemoryFileSystem());
 *
 * `memoryFileSystem()` le retrouve ensuite : `store` associe chaque URI à son contenu,
 * `failWrites` simule un disque plein, `reset()` vide tout.
 */
export const createMemoryFileSystem = () =>
	createFakeExpoFileSystem({ documentUri: "file:///documents", cacheUri: "file:///cache" });

export const memoryFileSystem = getFakeExpoFileSystem;
