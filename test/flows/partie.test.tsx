import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makePlayer } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

// Parcours complet dans les vrais écrans : c'est ce test qui casse en premier si une mise à jour
// d'Expo Router, de React Navigation ou de React Native change le comportement de l'app.

jest.setTimeout(30_000);

beforeEach(() => {
	usePlayersStore.setState({
		players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
	});
	useGamesStore.setState({ games: [] });
	useHistoryStore.setState({ sessions: [] });
	useSessionStore.getState().resetSession();
});

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));
const type = (label: string, text: string, index = 0) =>
	fireEvent.changeText(screen.getAllByLabelText(label)[index], text);

describe("une partie de bout en bout", () => {
	it("crée un jeu, joue une partie et l'enregistre dans l'historique", async () => {
		const app = await renderApp("/jeux");

		// Création du jeu : une catégorie « Nombre » et une « Oui / Non ».
		await press("Créer un jeu");
		expect(app.getPathname()).toBe("/jeux/new");
		await type("Nom du jeu", "Azul");
		await type("Joueurs min.", "2");
		await type("Joueurs max.", "4");
		await type("Nom de la catégorie", "Murs");
		await press("Ajouter une catégorie");
		await type("Nom de la catégorie", "Plus grand mur", 1);
		await fireEvent.press(screen.getAllByRole("radio", { name: "Oui / Non" })[1]);
		await type("Score si Oui", "5");
		await press("Créer le jeu");

		expect(app.getPathname()).toBe("/jeux");
		expect(useGamesStore.getState().games).toHaveLength(1);

		// Lancement avec les deux joueurs.
		await press("Azul, 2 catégories");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Alice" }));
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await press("Lancer une partie");

		// Étape 1 : Murs.
		expect(await screen.findByText("Étape 1 / 2")).toBeOnTheScreen();
		const [aliceField, bobField] = screen.getAllByDisplayValue("0");
		await fireEvent.changeText(aliceField, "12");
		await fireEvent.changeText(bobField, "8");
		expect(useSessionStore.getState().entries.alice.scores).toEqual(
			expect.objectContaining({ [useGamesStore.getState().games[0].categories[0].id]: 12 }),
		);

		// Étape 2 : Oui / Non, Bob passe devant.
		await press("Étape suivante");
		expect(await screen.findByText("Étape 2 / 2")).toBeOnTheScreen();
		await fireEvent.press(screen.getAllByRole("radio", { name: "Oui (+5)" })[1]);
		await fireEvent.press(screen.getAllByRole("radio", { name: "Non (+0)" })[0]);

		// Classement puis enregistrement.
		await press("Voir les résultats");
		expect(await screen.findByText("Classement")).toBeOnTheScreen();
		expect(app.getPathname()).toBe("/jeux/play/results");
		const totals = screen.getAllByText(/^(12|13)$/).map((t) => t.props.children);
		expect(totals).toEqual([13, 12]);

		await press("Terminer et enregistrer la partie");
		expect(app.getPathname()).toBe("/jeux");
		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);

		const [saved] = useHistoryStore.getState().sessions;
		expect(saved.playerIds).toEqual(["alice", "bob"]);
		expect(saved.finishedAt).toEqual(expect.any(Number));
	});

	it("ne compte les points d'une catégorie à critère qu'une fois le critère validé", async () => {
		const app = await renderApp("/jeux");

		await press("Créer un jeu");
		await type("Nom du jeu", "Kingdomino");
		await type("Nom de la catégorie", "Royaume");
		await fireEvent(screen.getByLabelText("Critère à valider"), "valueChange", true);
		await press("Créer le jeu");
		expect(useGamesStore.getState().games[0].categories[0].requiresValidation).toBe(true);
		const key = useGamesStore.getState().games[0].categories[0].id;

		await press("Kingdomino, 1 catégorie");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Alice" }));
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await press("Lancer une partie");

		// Aucun champ de points tant que le critère n'est pas coché.
		expect(await screen.findByText("Étape 1 / 1")).toBeOnTheScreen();
		const [aliceCheck, bobCheck] = screen.getAllByRole("checkbox", { name: "Critère validé" });
		expect(screen.queryAllByDisplayValue("0")).toHaveLength(0);

		await fireEvent.press(aliceCheck);
		await fireEvent.press(bobCheck);
		const [aliceField, bobField] = screen.getAllByDisplayValue("0");
		await fireEvent.changeText(aliceField, "20");
		await fireEvent.changeText(bobField, "30");

		// Bob ne remplit finalement pas le critère : ses points disparaissent du total.
		await fireEvent.press(bobCheck);
		expect(screen.getAllByDisplayValue(/^\d+$/)).toHaveLength(1);
		const { entries } = useSessionStore.getState();
		expect(entries.alice).toMatchObject({ scores: { [key]: 20 }, validated: [key] });
		expect(entries.bob).toMatchObject({ scores: {}, validated: [] });

		await press("Voir les résultats");
		expect(await screen.findByText("Classement")).toBeOnTheScreen();
		expect(app.getPathname()).toBe("/jeux/play/results");
		expect(screen.getAllByText(/^(20|0)$/).map((t) => t.props.children)).toEqual([20, 0]);
	});
});
