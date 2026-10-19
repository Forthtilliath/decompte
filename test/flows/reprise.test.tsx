import { fireEvent, screen } from "expo-router/testing-library";
import { Alert, type AlertButton } from "react-native";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makeCategory, makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

const PLAYED_AT = Date.UTC(2026, 9, 19, 12);

/** Répond à chaque boîte de dialogue en choisissant le bouton qui n'est pas « Annuler ». */
const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
	(buttons as AlertButton[] | undefined)?.find((b) => b.style !== "cancel")?.onPress?.();
});

beforeEach(() => {
	alert.mockClear();
	usePlayersStore.setState({
		players: [
			makePlayer({ id: "alice", name: "Alice" }),
			makePlayer({ id: "bob", name: "Bob" }),
			makePlayer({ id: "carole", name: "Carole", isArchived: true }),
		],
	});
	useGamesStore.setState({
		games: [
			makeGame({
				id: "azul",
				name: "Azul",
				minPlayers: 2,
				maxPlayers: 4,
				categories: [
					makeCategory({ id: "murs", label: "Murs" }),
					makeCategory({ id: "bonus", label: "Bonus" }),
				],
			}),
		],
	});
	useHistoryStore.setState({ sessions: [] });
	useSessionStore.getState().resetSession();
});

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

describe("partie en cours", () => {
	it("reprend à la dernière étape affichée et permet de revenir en arrière", async () => {
		useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
		useSessionStore.getState().setCurrentCategory("bonus");
		const app = await renderApp("/jeux");

		await press("Reprendre la partie en cours (Azul)");
		expect(app.getPathname()).toBe("/jeux/play/bonus");
		expect(await screen.findByText("Étape 2 / 2")).toBeOnTheScreen();

		await press("Étape précédente");
		expect(await screen.findByText("Étape 1 / 2")).toBeOnTheScreen();
		expect(useSessionStore.getState().currentCategoryId).toBe("murs");
	});

	it("lance la partie dans l'ordre où les joueurs ont été cochés", async () => {
		await renderApp("/jeux/azul");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await fireEvent.press(screen.getByRole("checkbox", { name: "Alice" }));

		expect(
			screen.getByRole("checkbox", { name: "Bob", value: { text: "joue en position 1" } }),
		).toBeOnTheScreen();
		await press("Lancer une partie");
		expect(useSessionStore.getState().playerIds).toEqual(["bob", "alice"]);
	});

	it("change l'ordre des joueurs en cours de partie", async () => {
		useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
		await renderApp("/jeux/play/murs");

		await press("Ordre des joueurs");
		expect(screen.getByRole("button", { name: "Monter Alice" })).toBeDisabled();
		await press("Monter Bob");

		expect(useSessionStore.getState().playerIds).toEqual(["bob", "alice"]);
		expect(screen.getByRole("button", { name: "Monter Bob" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Descendre Bob" })).toBeEnabled();
	});

	it("abandonne la partie après confirmation, sans rien enregistrer", async () => {
		useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
		await renderApp("/jeux");

		await press("Abandonner la partie en cours");

		expect(alert).toHaveBeenCalledWith(
			"Abandonner la partie en cours ?",
			"Les scores déjà saisis seront perdus.",
			expect.any(Array),
		);
		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
		expect(useHistoryStore.getState().sessions).toEqual([]);
		expect(
			screen.queryByRole("button", { name: "Reprendre la partie en cours (Azul)" }),
		).not.toBeOnTheScreen();
	});

	it("bloque le lancement d'une partie sur un autre jeu tant qu'une partie est en cours", async () => {
		useGamesStore.setState({
			games: [...useGamesStore.getState().games, makeGame({ id: "belote", name: "Belote" })],
		});
		useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
		await renderApp("/jeux/belote");

		expect(await screen.findByText(/Une partie est en cours sur un autre jeu/)).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: "Lancer une partie" })).not.toBeOnTheScreen();
	});

	it("renvoie à la liste des jeux si on ouvre une étape sans partie en cours", async () => {
		const app = await renderApp("/jeux/play/murs");
		await screen.findByText("Créer un jeu");
		expect(app.getPathname()).toBe("/jeux");
	});
});

describe("historique", () => {
	beforeEach(() => {
		useHistoryStore.setState({
			sessions: [
				makeSession({
					id: "s1",
					gameDefId: "azul",
					createdAt: PLAYED_AT,
					finishedAt: PLAYED_AT,
					playerIds: ["alice", "carole", "bob"],
					entries: {
						alice: makeEntry("alice", { murs: 10 }),
						carole: makeEntry("carole", { murs: 30 }),
						bob: makeEntry("bob", { murs: 20 }),
					},
				}),
			],
		});
	});

	it("affiche le classement d'une partie passée", async () => {
		const app = await renderApp("/historique");
		await press("Voir le détail de la partie du 19 octobre 2026");

		expect(app.getPathname()).toBe("/history/s1");
		expect(await screen.findByText("Carole")).toBeOnTheScreen();
		expect(screen.getAllByText(/^🥇|🥈|🥉$/).map((m) => m.props.children)).toEqual([
			"🥇",
			"🥈",
			"🥉",
		]);
	});

	it("rejoue avec les joueurs encore disponibles, après avoir prévenu", async () => {
		const app = await renderApp("/history/s1");
		await press("Rejouer avec les mêmes joueurs");

		expect(alert).toHaveBeenCalledWith(
			"Certains joueurs ne sont plus disponibles",
			"La partie démarrera uniquement avec les joueurs restants.",
			expect.any(Array),
		);
		expect(app.getPathname()).toBe("/jeux/play/murs");
		expect(useSessionStore.getState().playerIds).toEqual(["alice", "bob"]);
	});

	it("refuse de rejouer pendant une autre partie", async () => {
		useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
		const app = await renderApp("/history/s1");
		await press("Rejouer avec les mêmes joueurs");

		expect(alert).toHaveBeenCalledWith(
			"Une partie est déjà en cours",
			"Termine-la ou abandonne-la depuis l'onglet Jeux avant d'en lancer une nouvelle.",
		);
		expect(app.getPathname()).toBe("/history/s1");
	});

	it("supprime une partie après confirmation et revient à l'historique", async () => {
		const app = await renderApp("/historique");
		await press("Voir le détail de la partie du 19 octobre 2026");
		await press("Supprimer cette partie");

		expect(useHistoryStore.getState().sessions).toEqual([]);
		expect(app.getPathname()).toBe("/historique");
		expect(await screen.findByText("Aucune partie enregistrée pour l'instant.")).toBeOnTheScreen();
	});
});

describe("modification d'un jeu", () => {
	it("garde l'id des catégories pour que l'historique reste lisible", async () => {
		await renderApp("/jeux/azul/edit");
		await fireEvent.changeText(screen.getAllByLabelText("Nom de la catégorie")[0], "Murs complets");
		await press("Enregistrer");

		const [game] = useGamesStore.getState().games;
		expect(game.categories.map((c) => [c.id, c.label])).toEqual([
			["murs", "Murs complets"],
			["bonus", "Bonus"],
		]);
	});

	it("refuse l'archivage et la modification pendant une partie sur ce jeu", async () => {
		useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
		await renderApp("/jeux/azul");
		expect(await screen.findByRole("button", { name: "Modifier" })).toBeDisabled();
		expect(screen.getByRole("button", { name: "Archiver" })).toBeDisabled();
	});

	it("archive un jeu après confirmation", async () => {
		await renderApp("/jeux/azul");
		await press("Archiver");
		expect(useGamesStore.getState().games[0].isArchived).toBe(true);
	});
});
