import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makeCategory, makeGame, makePlayer } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

// Jeu en plusieurs manches (type Pixies) : chaque catégorie se saisit une fois par manche.

jest.setTimeout(30_000);

beforeEach(() => {
	usePlayersStore.setState({
		players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
	});
	useGamesStore.setState({
		games: [
			makeGame({
				id: "pixies",
				name: "Pixies",
				minPlayers: 2,
				maxPlayers: 5,
				rounds: 2,
				categories: [
					makeCategory({ id: "cartes", label: "Cartes" }),
					makeCategory({ id: "couleurs", label: "Couleurs" }),
				],
			}),
		],
	});
	useHistoryStore.setState({ sessions: [] });
	useSessionStore.getState().resetSession();
});

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));
const fillScores = async (alice: string, bob: string) => {
	const [aliceField, bobField] = screen.getAllByDisplayValue("0");
	await fireEvent.changeText(aliceField, alice);
	await fireEvent.changeText(bobField, bob);
};

describe("une partie en plusieurs manches", () => {
	it("saisit chaque catégorie à chaque manche, puis additionne les manches", async () => {
		const app = await renderApp("/jeux/pixies");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Alice" }));
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await press("Lancer une partie");

		expect(await screen.findByText(/Manche 1 \/ 2/)).toBeOnTheScreen();
		await fillScores("5", "3");
		await press("Étape suivante");
		await fillScores("2", "4");

		// Fin de la manche 1 : on repart sur la première catégorie, champs vierges.
		await press("Étape suivante");
		expect(await screen.findByText(/Manche 2 \/ 2/)).toBeOnTheScreen();
		expect(screen.getByText(/Étape 1 \/ 2/)).toBeOnTheScreen();
		expect(app.getPathname()).toBe("/jeux/play/cartes");
		await fillScores("6", "1");

		// Retour arrière d'une manche à l'autre : les points de la manche 1 sont toujours là.
		await press("Étape précédente");
		expect(await screen.findByText(/Manche 1 \/ 2/)).toBeOnTheScreen();
		expect(screen.getByDisplayValue("2")).toBeOnTheScreen();
		await press("Étape suivante");
		expect(await screen.findByText(/Manche 2 \/ 2/)).toBeOnTheScreen();
		expect(screen.getByDisplayValue("6")).toBeOnTheScreen();

		await press("Étape suivante");
		await fillScores("0", "7");
		await press("Voir les résultats");

		// Alice 5+2 puis 6+0 = 13 ; Bob 3+4 puis 1+7 = 15.
		expect(await screen.findByText("Manche 1 : 7  ·  Manche 2 : 8")).toBeOnTheScreen();
		expect(screen.getByText("Manche 1 : 7  ·  Manche 2 : 6")).toBeOnTheScreen();
		expect(screen.getAllByText(/^(13|15)$/).map((t) => t.props.children)).toEqual([15, 13]);
		expect(screen.getByText("Cartes 11")).toBeOnTheScreen();

		await press("Terminer et enregistrer la partie");
		const [saved] = useHistoryStore.getState().sessions;
		expect(saved.entries.alice.scores).toEqual({
			cartes: 5,
			couleurs: 2,
			"cartes#2": 6,
			"couleurs#2": 0,
		});
	});

	it("reprend la partie dans la bonne manche", async () => {
		useSessionStore.getState().startNewSession("pixies", ["alice", "bob"]);
		useSessionStore.getState().setCurrentCategory("couleurs", 2);
		await renderApp("/jeux");

		await press("Reprendre la partie en cours (Pixies)");
		expect(await screen.findByText(/Manche 2 \/ 2/)).toBeOnTheScreen();
		expect(screen.getByText(/Étape 2 \/ 2/)).toBeOnTheScreen();
	});

	it("règle le nombre de manches depuis le formulaire du jeu", async () => {
		await renderApp("/jeux/pixies/edit");
		expect(screen.getByLabelText("Manches")).toHaveDisplayValue("2");
		await fireEvent.changeText(screen.getByLabelText("Manches"), "3");
		await press("Enregistrer");

		expect(useGamesStore.getState().games[0].rounds).toBe(3);
	});
});
