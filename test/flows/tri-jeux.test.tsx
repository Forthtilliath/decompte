import AsyncStorage from "@react-native-async-storage/async-storage";
import { fireEvent, screen } from "expo-router/testing-library";
import { useGameListStore } from "@/stores/gameListStore";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { makeGame, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

beforeEach(() => {
	useGameListStore.setState({ sortOrder: "recent" });
	useGamesStore.setState({
		games: [
			makeGame({ id: "skyjo", name: "Skyjo", createdAt: 1 }),
			makeGame({ id: "azul", name: "Azul", createdAt: 2 }),
			makeGame({ id: "dixit", name: "Dixit", createdAt: 3 }),
		],
	});
	useHistoryStore.setState({
		sessions: [
			makeSession({ id: "s2", gameDefId: "skyjo", createdAt: 20 }),
			makeSession({ id: "s1", gameDefId: "dixit", createdAt: 10 }),
		],
	});
});

/** Noms des jeux de la liste, dans l'ordre affiché. */
const listedGames = () =>
	screen
		.getAllByRole("button", { name: /catégorie/ })
		.map((row) => row.props.accessibilityLabel.split(",")[0]);

describe("tri de la liste des jeux", () => {
	it("montre d'abord les jeux joués récemment, puis trie selon l'ordre choisi et le garde", async () => {
		await renderApp("/jeux");

		expect(await screen.findByText("Joués récemment")).toBeOnTheScreen();
		expect(listedGames()).toEqual(["Skyjo", "Dixit", "Azul"]);

		await fireEvent.press(screen.getByRole("button", { name: /Trier les jeux/ }));
		await fireEvent.press(await screen.findByRole("radio", { name: "Ordre alphabétique" }));

		expect(listedGames()).toEqual(["Azul", "Dixit", "Skyjo"]);
		expect(
			screen.getByRole("button", { name: "Trier les jeux : Ordre alphabétique" }),
		).toBeOnTheScreen();
		const persisted = JSON.parse((await AsyncStorage.getItem("game-list-store")) ?? "{}");
		expect(persisted.state).toEqual({ sortOrder: "alpha" });
	});

	it("propose aussi les jeux les plus joués et ceux ajoutés récemment", async () => {
		useHistoryStore.setState({
			sessions: [
				makeSession({ id: "s3", gameDefId: "skyjo", createdAt: 30 }),
				makeSession({ id: "s2", gameDefId: "azul", createdAt: 20 }),
				makeSession({ id: "s1", gameDefId: "azul", createdAt: 10 }),
			],
		});
		await renderApp("/jeux");
		await screen.findByText("Joués récemment");

		await fireEvent.press(screen.getByRole("button", { name: /Trier les jeux/ }));
		await fireEvent.press(await screen.findByRole("radio", { name: "Les plus joués" }));
		expect(listedGames()).toEqual(["Azul", "Skyjo", "Dixit"]);

		await fireEvent.press(screen.getByRole("button", { name: /Trier les jeux/ }));
		await fireEvent.press(await screen.findByRole("radio", { name: "Ajoutés récemment" }));
		expect(listedGames()).toEqual(["Dixit", "Azul", "Skyjo"]);
	});
});
