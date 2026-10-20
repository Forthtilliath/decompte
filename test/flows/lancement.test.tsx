import { useKeepAwake } from "expo-keep-awake";
import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makeCategory, makeGame, makeGroup, makePlayer, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

beforeEach(() => {
	usePlayersStore.setState({
		players: [
			makePlayer({ id: "alice", name: "Alice" }),
			makePlayer({ id: "bob", name: "Bob" }),
			makePlayer({ id: "carole", name: "Carole" }),
			makePlayer({ id: "denis", name: "Denis", isArchived: true }),
		],
	});
	useGroupsStore.setState({
		groups: [
			makeGroup({ id: "jeudi", name: "Jeudi", playerIds: ["carole", "denis", "alice"] }),
			makeGroup({ id: "vide", name: "Partis", playerIds: ["denis"] }),
		],
	});
	useGamesStore.setState({
		games: [
			makeGame({
				id: "azul",
				name: "Azul",
				minPlayers: 2,
				maxPlayers: 3,
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

describe("lancement d'une partie", () => {
	it("coche tout un groupe d'un geste, dans l'ordre du groupe, sans ses joueurs archivés", async () => {
		await renderApp("/jeux/azul");
		// Un groupe dont plus aucun joueur n'est disponible n'est pas proposé.
		expect(screen.queryByRole("checkbox", { name: /^Groupe Partis/ })).not.toBeOnTheScreen();

		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await fireEvent.press(screen.getByRole("checkbox", { name: "Groupe Jeudi, 2 joueurs" }));
		expect(screen.getByRole("checkbox", { name: "Groupe Jeudi, 2 joueurs" })).toBeChecked();

		await press("Lancer une partie");
		expect(useSessionStore.getState().playerIds).toEqual(["bob", "carole", "alice"]);
	});

	it("décoche le groupe d'un second appui", async () => {
		await renderApp("/jeux/azul");
		const group = () => screen.getByRole("checkbox", { name: "Groupe Jeudi, 2 joueurs" });
		await fireEvent.press(group());
		await fireEvent.press(group());

		expect(group()).not.toBeChecked();
		expect(screen.getByRole("checkbox", { name: "Alice" })).not.toBeChecked();
		expect(screen.getByRole("button", { name: "Lancer une partie" })).toBeDisabled();
	});

	it("présente d'abord les joueurs qui jouent le plus souvent", async () => {
		useHistoryStore.setState({
			sessions: [
				makeSession({ id: "s1", playerIds: ["carole", "bob"] }),
				makeSession({ id: "s2", playerIds: ["carole"] }),
			],
		});
		await renderApp("/jeux/azul");
		const names = screen
			.getAllByRole("checkbox")
			.map((c) => c.props.accessibilityLabel)
			.filter((label: string) => !label.startsWith("Groupe"));
		expect(names).toEqual(["Carole", "Bob", "Alice"]);
	});
});

describe("saisie des scores", () => {
	beforeEach(() => {
		useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
	});

	it("garde l'écran allumé et passe à l'étape suivante par le bouton du bas", async () => {
		const app = await renderApp("/jeux/play/murs");
		expect(useKeepAwake).toHaveBeenCalled();

		await press("Suivant : Bonus");
		expect(await screen.findByText("Étape 2 / 2")).toBeOnTheScreen();
		await press("Voir le classement");
		expect(app.getPathname()).toBe("/jeux/play/results");
	});

	it("signale avant l'enregistrement les catégories jamais saisies, et y ramène", async () => {
		useSessionStore.getState().updateScore("alice", "murs", 0);
		useSessionStore.getState().updateScore("alice", "bonus", 4);
		useSessionStore.getState().updateScore("bob", "bonus", 2);
		const app = await renderApp("/jeux/play/results");

		expect(screen.getByText("Non saisi, compté 0")).toBeOnTheScreen();
		// Le 0 saisi par Alice n'est pas signalé, seule l'absence de saisie de Bob l'est.
		await press("Compléter Murs : Bob");
		expect(app.getPathname()).toBe("/jeux/play/murs");
	});

	it("n'affiche rien quand tout a été saisi", async () => {
		for (const id of ["alice", "bob"]) {
			useSessionStore.getState().updateScore(id, "murs", 1);
			useSessionStore.getState().updateScore(id, "bonus", 0);
		}
		await renderApp("/jeux/play/results");
		expect(screen.queryByText("Non saisi, compté 0")).not.toBeOnTheScreen();
	});
});
