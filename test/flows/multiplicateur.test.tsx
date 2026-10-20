import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makeCategory, makeGame, makePlayer } from "@/test/factories";
import { tapStepper } from "@/test/interactions";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

beforeEach(() => {
	usePlayersStore.setState({ players: [makePlayer({ id: "alice", name: "Alice" })] });
	useGamesStore.setState({
		games: [
			makeGame({
				id: "sushi",
				name: "Sushi",
				minPlayers: 1,
				categories: [
					makeCategory({ id: "sets", label: "Sets" }),
					makeCategory({
						id: "bonus",
						label: "Bonus",
						brick: { kind: "product", sourceId: "sets" },
					}),
				],
			}),
		],
	});
	useHistoryStore.setState({ sessions: [] });
	useSessionStore.getState().resetSession();
});

describe("catégorie multiplicateur", () => {
	it("multiplie le nombre saisi par les points de la catégorie choisie", async () => {
		await renderApp("/jeux/sushi");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Alice" }));
		await fireEvent.press(screen.getByRole("button", { name: "Lancer une partie" }));

		await fireEvent.changeText(await screen.findByDisplayValue("0"), "4");
		await fireEvent.press(screen.getByRole("button", { name: "Étape suivante" }));

		expect(await screen.findByText("× 4 (Sets) = 0 points")).toBeOnTheScreen();
		for (let i = 0; i < 3; i++) await tapStepper("Augmenter Bonus");
		expect(screen.getByText("× 4 (Sets) = 12 points")).toBeOnTheScreen();
		expect(screen.getByLabelText("Total : 16 points")).toBeOnTheScreen();
	});
});
