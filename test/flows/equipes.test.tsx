import { act, fireEvent, screen } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makeCategory, makeGame, makePlayer } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

beforeEach(() => {
	usePlayersStore.setState({
		players: ["Alice", "Bob", "Carole", "Denis"].map((name) =>
			makePlayer({ id: name.toLowerCase(), name }),
		),
	});
	useGamesStore.setState({
		games: [
			makeGame({
				id: "belote",
				name: "Belote",
				minPlayers: 2,
				maxPlayers: 4,
				teamPlay: true,
				tieBreakerId: "belote",
				categories: [
					makeCategory({ id: "plis", label: "Plis" }),
					makeCategory({ id: "belote", label: "Belote" }),
				],
			}),
		],
	});
	useHistoryStore.setState({ sessions: [] });
	useSessionStore.getState().resetSession();
});

describe("partie en équipes", () => {
	it("compose les équipes au lancement et classe les équipes au total", async () => {
		await renderApp("/jeux/belote");
		for (const name of ["Alice", "Bob", "Carole", "Denis"]) {
			await fireEvent.press(screen.getByRole("checkbox", { name }));
		}

		// À tour de rôle par défaut (Alice et Carole, Bob et Denis) : Bob passe dans l'équipe 1,
		// Carole dans la 2.
		await fireEvent.press(screen.getAllByRole("radio", { name: "Équipe 1" })[1]);
		await fireEvent.press(screen.getAllByRole("radio", { name: "Équipe 2" })[2]);
		await fireEvent.press(screen.getByRole("button", { name: "Lancer une partie" }));

		const state = useSessionStore.getState();
		expect(state.teams?.map((t) => t.playerIds)).toEqual([
			["alice", "bob"],
			["carole", "denis"],
		]);
		// Saisie dans l'ordre des équipes ; règles du jeu recopiées dans la partie.
		expect(state.playerIds).toEqual(["alice", "bob", "carole", "denis"]);
		expect(state.tieBreakerId).toBe("belote");

		await act(() => {
			for (const [id, points] of [
				["alice", 40],
				["bob", 30],
				["carole", 60],
				["denis", 20],
			] as const) {
				state.updateScore(id, "plis", points);
			}
			state.updateScore("alice", "belote", 20);
		});

		await fireEvent.press(screen.getByRole("button", { name: "Étape suivante" }));
		await fireEvent.press(await screen.findByRole("button", { name: "Voir les résultats" }));
		expect(await screen.findByLabelText("1e, Équipe 1, 90 points : Alice, Bob")).toBeOnTheScreen();
		expect(screen.getByLabelText("2e, Équipe 2, 80 points : Carole, Denis")).toBeOnTheScreen();
	});
});
