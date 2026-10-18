import AsyncStorage from "@react-native-async-storage/async-storage";
import {
	GROUPS_STORE_VERSION,
	migrateGroupsStoreData,
	selectSortedGroups,
	useGroupsStore,
} from "@/stores/groupsStore";
import { makeGroup } from "@/test/factories";
import { readPersisted, writePersisted } from "@/test/persistence";

beforeEach(async () => {
	useGroupsStore.setState({ groups: [] });
	await AsyncStorage.clear();
	jest.spyOn(Date, "now").mockReturnValue(7_000);
});

afterEach(() => jest.restoreAllMocks());

describe("useGroupsStore", () => {
	it("crée un groupe au nom nettoyé", () => {
		const group = useGroupsStore.getState().addGroup({ name: " Jeudi ", playerIds: ["a", "b"] });
		expect(group).toEqual({
			id: expect.any(String),
			name: "Jeudi",
			playerIds: ["a", "b"],
			isFavorite: false,
			isArchived: false,
			createdAt: 7_000,
		});
	});

	it("modifie nom et membres du groupe ciblé uniquement", () => {
		const other = makeGroup({ id: "autre" });
		useGroupsStore.setState({ groups: [other, makeGroup({ id: "g" })] });
		useGroupsStore.getState().updateGroup("g", { name: " Vendredi ", playerIds: ["c"] });
		const [unchanged, updated] = useGroupsStore.getState().groups;
		expect(unchanged).toBe(other);
		expect(updated).toMatchObject({ id: "g", name: "Vendredi", playerIds: ["c"] });
	});

	it("bascule favori/archivage et supprime", () => {
		useGroupsStore.setState({ groups: [makeGroup({ id: "g" }), makeGroup({ id: "h" })] });
		const { toggleFavorite, toggleArchived, removeGroup } = useGroupsStore.getState();
		toggleFavorite("g");
		toggleArchived("g");
		expect(useGroupsStore.getState().groups[0]).toMatchObject({
			isFavorite: true,
			isArchived: true,
		});
		removeGroup("g");
		expect(useGroupsStore.getState().groups.map((g) => g.id)).toEqual(["h"]);
	});
});

describe("removePlayerFromGroups", () => {
	it("retire le joueur de tous ses groupes sans toucher aux autres", () => {
		const untouched = makeGroup({ id: "sans", playerIds: ["b"] });
		useGroupsStore.setState({
			groups: [
				makeGroup({ id: "g1", playerIds: ["a", "b"] }),
				untouched,
				makeGroup({ id: "g2", playerIds: ["a"] }),
			],
		});
		useGroupsStore.getState().removePlayerFromGroups("a");
		const [g1, kept, g2] = useGroupsStore.getState().groups;
		expect(g1.playerIds).toEqual(["b"]);
		expect(kept).toBe(untouched);
		expect(g2.playerIds).toEqual([]);
	});
});

describe("selectSortedGroups", () => {
	it("trie favoris, puis actifs, puis archivés, par ordre alphabétique", () => {
		const groups = [
			makeGroup({ name: "Week-end" }),
			makeGroup({ name: "Archivé", isArchived: true }),
			makeGroup({ name: "Travail", isFavorite: true }),
			makeGroup({ name: "Famille" }),
		];
		expect(selectSortedGroups(groups).map((g) => g.name)).toEqual([
			"Travail",
			"Famille",
			"Week-end",
			"Archivé",
		]);
	});
});

describe("persistance des groupes", () => {
	it("écrit sous la clé et la version attendues", async () => {
		useGroupsStore.getState().addGroup({ name: "Jeudi", playerIds: [] });
		const persisted = await readPersisted("groups-store");
		expect(persisted.version).toBe(1);
		expect(persisted.state).toEqual({ groups: useGroupsStore.getState().groups });
	});

	it("recharge les groupes enregistrés", async () => {
		const groups = [makeGroup({ id: "sauvegarde" })];
		await writePersisted("groups-store", { groups }, GROUPS_STORE_VERSION);
		await useGroupsStore.persist.rehydrate();
		expect(useGroupsStore.getState().groups).toEqual(groups);
	});

	it("réinitialise une version inconnue", () => {
		expect(migrateGroupsStoreData({ groups: [makeGroup()] }, 99)).toEqual({ groups: [] });
	});
});
