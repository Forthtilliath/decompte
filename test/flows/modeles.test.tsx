import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

beforeEach(() => {
	useGamesStore.setState({ games: [] });
});

describe("modèles de jeux", () => {
	it("ajoute un modèle en un geste et ouvre sa fiche", async () => {
		const app = await renderApp("/jeux");
		await fireEvent.press(screen.getByRole("button", { name: "Partir d'un modèle" }));
		await fireEvent.press(
			await screen.findByRole("button", {
				name: "Golf (jeu de cartes), Le plus bas gagne, 9 manches",
			}),
		);

		const [game] = useGamesStore.getState().games;
		expect(game).toMatchObject({ name: "Golf (jeu de cartes)", rounds: 9, lowestWins: true });
		expect(app.getPathname()).toBe(`/jeux/${game.id}`);
	});
});
