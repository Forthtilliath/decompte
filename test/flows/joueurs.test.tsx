import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useThemeStore } from "@/stores/themeStore";
import { mockAlert } from "@/test/alerts";
import { makeEntry, makeGame, makeGroup, makePlayer, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

const { spy: alert, choose } = mockAlert();

beforeEach(() => {
	alert.mockClear();
	choose();
	useHistoryStore.setState({ sessions: [] });
	useSessionStore.getState().resetSession();
	usePlayersStore.setState({ players: [makePlayer({ id: "alice", name: "Alice" })] });
	useGroupsStore.setState({ groups: [] });
	useThemeStore.setState({ mode: "dark" });
});

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

describe("joueurs", () => {
	it("ajoute un joueur depuis l'onglet Joueurs", async () => {
		const app = await renderApp("/joueurs");
		await press("Ajouter un joueur");
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), "Bob");
		await press("Créer le joueur");

		expect(app.getPathname()).toBe("/joueurs");
		expect(usePlayersStore.getState().players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
		expect(await screen.findByRole("button", { name: "Modifier Bob" })).toBeOnTheScreen();
		expect(alert).not.toHaveBeenCalled();
	});

	it("crée quand même un homonyme, en prévenant", async () => {
		await renderApp("/joueurs");
		await press("Ajouter un joueur");
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), " alice ");
		await press("Créer le joueur");

		expect(alert).toHaveBeenCalledWith(
			"Un joueur du même nom existe déjà",
			expect.any(String),
			expect.any(Array),
		);
		expect(usePlayersStore.getState().players).toHaveLength(2);
	});

	it("renomme puis supprime un joueur", async () => {
		await renderApp("/joueurs");
		await press("Modifier Alice");
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), "Alicia");
		await press("Enregistrer");
		expect(usePlayersStore.getState().players[0].name).toBe("Alicia");

		await press("Modifier Alicia");
		choose("Supprimer");
		await press("Supprimer le joueur");
		expect(usePlayersStore.getState().players).toEqual([]);
		expect(await screen.findByText("Aucun joueur pour l'instant.")).toBeOnTheScreen();
	});

	it("met en favori, archive et recherche", async () => {
		usePlayersStore.setState({
			players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
		});
		await renderApp("/joueurs");

		await fireEvent.press(screen.getAllByRole("button", { name: "Ajouter aux favoris" })[1]);
		expect(usePlayersStore.getState().players.find((p) => p.id === "bob")?.isFavorite).toBe(true);
		await fireEvent.press(screen.getAllByRole("button", { name: "Archiver" })[0]);
		expect(usePlayersStore.getState().players.filter((p) => p.isArchived)).toHaveLength(1);

		await fireEvent.changeText(screen.getByPlaceholderText("Rechercher un joueur..."), "zzz");
		expect(screen.getByText("Aucun joueur ne correspond à cette recherche.")).toBeOnTheScreen();
	});
});

describe("suppression d'un joueur", () => {
	beforeEach(() => {
		usePlayersStore.setState({
			players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
		});
		useGroupsStore.setState({
			groups: [makeGroup({ id: "g", name: "Jeudi", playerIds: ["alice", "bob"] })],
		});
		useHistoryStore.setState({
			sessions: [
				makeSession({
					id: "s1",
					gameDefId: "game1",
					createdAt: Date.UTC(2026, 9, 19, 12),
					playerIds: ["alice", "bob"],
					entries: { alice: makeEntry("alice", { c1: 30 }), bob: makeEntry("bob", { c1: 10 }) },
				}),
			],
		});
	});

	it("garde ses scores dans l'historique, sous « Joueur supprimé », et le retire des groupes", async () => {
		useGamesStore.setState({ games: [makeGame({ id: "game1", name: "Azul" })] });
		const app = await renderApp("/joueurs");
		await press("Modifier Alice");
		choose("Supprimer");
		await press("Supprimer le joueur");

		expect(alert).toHaveBeenCalledWith(
			"Supprimer ce joueur ?",
			"Alice sera définitivement supprimé. Ses scores restent dans 1 partie de l'historique, sous « Joueur supprimé ». Il sera retiré de 1 groupe. L'archiver le masque des listes sans rien changer d'autre.",
			expect.any(Array),
		);
		expect(usePlayersStore.getState().players.map((p) => p.id)).toEqual(["bob"]);
		expect(useGroupsStore.getState().groups[0].playerIds).toEqual(["bob"]);
		expect(useHistoryStore.getState().sessions[0].entries.alice.scores).toEqual({ c1: 30 });

		// Le classement de la partie passée reste intact.
		await app.navigate("/historique");
		expect(await screen.findByText("Joueur supprimé")).toBeOnTheScreen();
		expect(screen.getByText("🥇 30")).toBeOnTheScreen();
		await press("Voir le détail de la partie du 19 octobre 2026");
		expect(await screen.findByText("Joueur supprimé")).toBeOnTheScreen();
		expect(screen.getByText("Bob")).toBeOnTheScreen();
	});

	it("archive au lieu de supprimer si on le choisit", async () => {
		await renderApp("/joueurs");
		await press("Modifier Alice");
		choose("Archiver");
		await press("Supprimer le joueur");

		const alice = usePlayersStore.getState().players.find((p) => p.id === "alice");
		expect(alice?.isArchived).toBe(true);
		expect(useGroupsStore.getState().groups[0].playerIds).toEqual(["alice", "bob"]);
	});

	it("ne change rien si on annule", async () => {
		await renderApp("/joueurs");
		await press("Modifier Alice");
		choose("Annuler");
		await press("Supprimer le joueur");

		expect(usePlayersStore.getState().players).toHaveLength(2);
		expect(usePlayersStore.getState().players[0].isArchived).toBe(false);
	});

	it("ne propose plus l'archivage d'un joueur déjà archivé", async () => {
		usePlayersStore.getState().toggleArchived("alice");
		await renderApp("/players/alice");
		choose("Annuler");
		await press("Supprimer le joueur");

		const buttons = alert.mock.calls[0][2]?.map((b) => b.text);
		expect(buttons).toEqual(["Annuler", "Supprimer"]);
	});

	it("refuse de supprimer un joueur de la partie en cours", async () => {
		useSessionStore.getState().startNewSession("game1", ["alice", "bob"]);
		await renderApp("/players/alice");
		await press("Supprimer le joueur");

		expect(alert).toHaveBeenCalledWith(
			"Joueur en pleine partie",
			"Alice joue la partie en cours. Termine-la ou abandonne-la avant de le supprimer.",
		);
		expect(usePlayersStore.getState().players).toHaveLength(2);
	});
});

describe("groupes", () => {
	it("crée un groupe avec ses membres", async () => {
		usePlayersStore.setState({
			players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
		});
		await renderApp("/joueurs");
		await press("Nouveau groupe");
		await fireEvent.changeText(screen.getByLabelText("Nom du groupe"), "Jeudi");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await press("Créer le groupe");

		expect(useGroupsStore.getState().groups).toEqual([
			expect.objectContaining({ name: "Jeudi", playerIds: ["bob"] }),
		]);
		expect(
			await screen.findByRole("button", { name: "Modifier le groupe Jeudi" }),
		).toBeOnTheScreen();
	});

	it("modifie puis supprime un groupe sans toucher aux joueurs", async () => {
		useGroupsStore.setState({
			groups: [makeGroup({ id: "g", name: "Jeudi", playerIds: ["alice"] })],
		});
		await renderApp("/joueurs");
		await press("Modifier le groupe Jeudi");
		await fireEvent.changeText(screen.getByLabelText("Nom du groupe"), "Vendredi");
		await press("Enregistrer");
		expect(useGroupsStore.getState().groups[0].name).toBe("Vendredi");

		await press("Modifier le groupe Vendredi");
		await press("Supprimer le groupe");
		expect(useGroupsStore.getState().groups).toEqual([]);
		expect(usePlayersStore.getState().players).toHaveLength(1);
	});
});

describe("réglages", () => {
	it("passe en thème clair et le garde", async () => {
		await renderApp("/reglages");
		await fireEvent.press(screen.getByRole("radio", { name: "Clair" }));
		expect(useThemeStore.getState().mode).toBe("light");
		expect(screen.getByRole("radio", { name: "Clair" })).toBeSelected();
	});
});
