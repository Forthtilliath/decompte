import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makeCategory, makeGame, makePlayer } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

// Manches enchaînées sans nombre fixé (type Odin) : jusqu'à un seuil de points, ou libres.

jest.setTimeout(30_000);

const odin = makeGame({
	id: "odin",
	name: "Odin",
	minPlayers: 2,
	maxPlayers: 6,
	lowestWins: true,
	openRounds: { scoreLimit: 15 },
	categories: [makeCategory({ id: "cartes", label: "Cartes en main" })],
});

beforeEach(() => {
	usePlayersStore.setState({
		players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
	});
	useGamesStore.setState({
		games: [odin, { ...odin, id: "libre", name: "Libre", openRounds: {} }],
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
const launch = async (gameId: string) => {
	await renderApp(`/jeux/${gameId}`);
	await fireEvent.press(screen.getByRole("checkbox", { name: "Alice" }));
	await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
	await press("Lancer une partie");
};

describe("une partie jusqu'à un seuil de points", () => {
	it("enchaîne les manches jusqu'au seuil, puis classe le plus bas en tête", async () => {
		await launch("odin");
		expect(await screen.findByText("Manche 1")).toBeOnTheScreen();
		await fillScores("5", "3");
		await press("Fin de la manche");

		// Personne n'a atteint 15 : on voit l'écart au seuil et on continue.
		expect(await screen.findByText(/s'arrête dès qu'un total atteint 15/)).toBeOnTheScreen();
		expect(screen.getByText("+5 cette manche  ·  encore 10 avant 15")).toBeOnTheScreen();
		expect(screen.getByText("+3 cette manche  ·  encore 12 avant 15")).toBeOnTheScreen();
		await press("Manche 2");

		expect(await screen.findByText("Manche 2")).toBeOnTheScreen();
		await fillScores("11", "2");
		await press("Fin de la manche");

		// Alice 5 + 11 = 16 : la partie s'arrête, plus de manche suivante.
		expect(
			await screen.findByText(/Alice atteint 15 points : la partie est terminée/),
		).toBeOnTheScreen();
		expect(screen.getByText("+11 cette manche  ·  seuil atteint")).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Manche 3" })).toBeNull();
		await press("Voir le classement");

		// Le plus bas en tête, et pas de détail « Cartes en main » qui redirait le total.
		expect(
			await screen.findByLabelText("1er, Bob, 5 points, manche 1 : 3, manche 2 : 2"),
		).toBeOnTheScreen();
		expect(
			screen.getByLabelText("2e, Alice, 16 points, manche 1 : 5, manche 2 : 11"),
		).toBeOnTheScreen();

		// Après la manche 1, Bob menait déjà ; Alice ne fait que creuser l'écart.
		await press("Voir le classement par manche");
		expect(screen.getByLabelText("1er, Bob, 3 points, +3 cette manche")).toBeOnTheScreen();
		expect(screen.getByLabelText("2e, Alice, 16 points, +11 cette manche")).toBeOnTheScreen();
		await press("Terminer et enregistrer la partie");

		const [saved] = useHistoryStore.getState().sessions;
		expect(saved.openRounds).toEqual({ scoreLimit: 15 });
		expect(saved.entries.alice.scores).toEqual({ cartes: 5, "cartes#2": 11 });
	});

	it("reprend une partie en cours dans la bonne manche", async () => {
		const session = useSessionStore.getState();
		session.startNewSession("odin", ["alice", "bob"], { openRounds: { scoreLimit: 15 } });
		session.setRoundCount(3);
		session.setCurrentCategory("cartes", 3);
		await renderApp("/jeux");

		await press("Reprendre la partie en cours (Odin)");
		expect(await screen.findByText("Manche 3")).toBeOnTheScreen();
	});

	it("règle le seuil depuis le formulaire du jeu", async () => {
		await renderApp("/jeux/odin/edit");
		expect(screen.getByLabelText("Seuil de fin de partie")).toHaveDisplayValue("15");
		await fireEvent.changeText(screen.getByLabelText("Seuil de fin de partie"), "20");
		await press("Enregistrer");
		expect(useGamesStore.getState().games[0].openRounds).toEqual({ scoreLimit: 20 });

		await renderApp("/jeux/odin/edit");
		await fireEvent.press(screen.getByRole("radio", { name: "Nombre fixe" }));
		await fireEvent.changeText(screen.getByLabelText("Manches"), "3");
		await press("Enregistrer");
		const [game] = useGamesStore.getState().games;
		expect(game.rounds).toBe(3);
		expect(game).not.toHaveProperty("openRounds");
	});
});

describe("une partie en manches libres", () => {
	it("s'arrête quand on veut, sans compter une manche ouverte puis laissée vide", async () => {
		await launch("libre");
		await fillScores("4", "6");
		await press("Fin de la manche");
		await press("Manche 2");
		expect(await screen.findByText("Manche 2")).toBeOnTheScreen();

		// Manche 2 ouverte par erreur : retour au récapitulatif de la manche 1, puis fin.
		await press("Étape précédente");
		await press("Fin de la manche");
		await press("Terminer la partie");

		expect(await screen.findByText("Classement")).toBeOnTheScreen();
		expect(useSessionStore.getState().roundCount).toBe(1);
		expect(screen.queryByText(/manche 2/i)).toBeNull();
	});
});
