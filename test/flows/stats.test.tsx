import { fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { makeCategory, makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

const DAY = 24 * 60 * 60 * 1000;
const START = Date.UTC(2026, 9, 1, 12);

function session(id: string, day: number, gameDefId: string, scores: Record<string, number>) {
	const playerIds = Object.keys(scores);
	return makeSession({
		id,
		gameDefId,
		createdAt: START + day * DAY,
		finishedAt: START + day * DAY,
		playerIds,
		entries: Object.fromEntries(
			playerIds.map((p) => [
				p,
				makeEntry(p, gameDefId === "azul" ? { murs: scores[p], malus: -2 } : { points: scores[p] }),
			]),
		),
	});
}

beforeEach(() => {
	usePlayersStore.setState({
		players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
	});
	useGamesStore.setState({
		games: [
			makeGame({
				id: "azul",
				name: "Azul",
				categories: [
					makeCategory({ id: "murs", label: "Murs" }),
					makeCategory({ id: "malus", label: "Malus", color: "#3b82f6" }),
				],
			}),
			makeGame({ id: "skyjo", name: "Skyjo", categories: [makeCategory({ id: "points" })] }),
		],
	});
	useHistoryStore.setState({
		sessions: [
			session("s3", 3, "skyjo", { alice: 5, bob: 9 }),
			session("s2", 2, "azul", { alice: 20, bob: 19 }),
			session("s1", 1, "azul", { alice: 30, bob: 10 }),
		],
	});
});

const press = (name: string | RegExp) => fireEvent.press(screen.getByRole("button", { name }));

describe("statistiques", () => {
	it("invite à jouer tant que l'historique est vide", async () => {
		useHistoryStore.setState({ sessions: [] });
		await renderApp("/stats");

		expect(await screen.findByText(/termine une partie pour voir apparaître/)).toBeOnTheScreen();
	});

	it("montre records, taux de victoire et jeux joués, puis le détail d'un joueur", async () => {
		await renderApp("/stats");

		expect(await screen.findByText("Records")).toBeOnTheScreen();
		// Tous jeux confondus, les scores ne se comparent pas : pas de meilleur score.
		expect(screen.queryByText("Meilleur score")).not.toBeOnTheScreen();
		expect(screen.getByLabelText("Plus longue série : 2, Alice")).toBeOnTheScreen();
		expect(screen.getByLabelText("1. Alice, 2 victoires sur 3 parties, 67%")).toBeOnTheScreen();
		expect(screen.getByLabelText(/^1\. Azul, Dernière partie le .*, 2 parties$/)).toBeOnTheScreen();

		await press(/^1\. Alice/);

		expect(screen.getByLabelText("Parties jouées : 3")).toBeOnTheScreen();
		expect(screen.getByText("Ses jeux")).toBeOnTheScreen();
		expect(screen.getByLabelText("1. Azul, 2 victoires sur 2 parties, 100%")).toBeOnTheScreen();
	});

	it("filtre sur un jeu pour voir les points par catégorie, en graphique ou en tableau", async () => {
		await renderApp("/stats");

		await press("Filtres · Tous les jeux");
		await fireEvent.press(await screen.findByRole("radio", { name: "Azul" }));
		await fireEvent.press(screen.getByRole("radio", { name: "Bob" }));

		// Malus de -2 compris dans chaque total.
		expect(await screen.findByLabelText("Meilleur score : 28 pts, Alice")).toBeOnTheScreen();
		expect(screen.getByLabelText("Score moyen : 12,5")).toBeOnTheScreen();
		expect(screen.getByLabelText("Murs : 14,5")).toBeOnTheScreen();
		expect(screen.getByLabelText("Malus : -2")).toBeOnTheScreen();
		expect(screen.getByLabelText("Murs : 100%")).toBeOnTheScreen();
		expect(screen.queryByText("Jeux les plus joués")).not.toBeOnTheScreen();

		await fireEvent.press(screen.getByRole("radio", { name: "Tableau" }));

		expect(await screen.findByText("Total")).toBeOnTheScreen();
		expect(screen.getByText("23")).toBeOnTheScreen();
	});
});

describe("graphiques d'une partie", () => {
	it("s'affichent à la demande dans le détail d'une partie", async () => {
		await renderApp("/history/s1");

		expect(screen.queryByText("Répartition par joueur")).not.toBeOnTheScreen();
		await press("Voir les graphiques");

		expect(await screen.findByText("Répartition par joueur")).toBeOnTheScreen();
		expect(screen.getByText("Comparaison par catégorie")).toBeOnTheScreen();
		expect(screen.getByLabelText("Alice : 30")).toBeOnTheScreen();
		expect(screen.getByLabelText("Bob : -2")).toBeOnTheScreen();
	});
});
