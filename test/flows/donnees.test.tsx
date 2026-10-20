import { fireEvent, screen } from "expo-router/testing-library";
import { Alert, type AlertButton } from "react-native";
import { exportRescueCopies } from "@/lib/rescueCopies";
import { reportDataIssue, useDataIssuesStore } from "@/stores/dataIssuesStore";
import { useGamesStore } from "@/stores/gamesStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makePlayer } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

jest.mock("@/lib/rescueCopies", () => ({
	...jest.requireActual("@/lib/rescueCopies"),
	exportRescueCopies: jest.fn(() => Promise.resolve()),
}));

/** Répond à chaque boîte de dialogue en choisissant le bouton qui n'est pas « Annuler ». */
const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
	(buttons as AlertButton[] | undefined)?.find((b) => b.style !== "cancel")?.onPress?.();
});

beforeEach(() => {
	alert.mockClear();
	useDataIssuesStore.getState().clear();
	useGamesStore.setState({ games: [] });
	usePlayersStore.setState({ players: [makePlayer({ id: "alice", name: "Alice" })] });
	useSessionStore.getState().resetSession();
});

describe("données non reprises au lancement", () => {
	it("prévient une seule fois pour tous les stores et propose d'exporter les copies", async () => {
		const copies = ["file:///documents/secours/a.json", "file:///documents/secours/b.json"];
		reportDataIssue({ storeName: "games-store", kind: "newer", copyUri: copies[0] });
		reportDataIssue({ storeName: "history-store", kind: "newer", copyUri: copies[1] });

		await renderApp("/jeux");

		expect(alert).toHaveBeenCalledTimes(1);
		expect(alert).toHaveBeenCalledWith(
			"Données non reprises",
			expect.stringContaining("les jeux et l'historique des parties"),
			expect.any(Array),
		);
		expect(exportRescueCopies).toHaveBeenCalledWith(copies);
		expect(useDataIssuesStore.getState().issues).toEqual([]);
	});

	it("n'affiche rien quand toutes les données ont été reprises", async () => {
		await renderApp("/jeux");
		expect(alert).not.toHaveBeenCalled();
	});
});

describe("partie en cours orpheline", () => {
	it("explique que la partie ne peut pas être reprise et permet de l'abandonner", async () => {
		useSessionStore.getState().startNewSession("jeu-disparu", ["alice"]);

		await renderApp("/jeux");

		expect(screen.getByText(/sur un jeu qui n'existe plus/)).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: /Reprendre/ })).toBeNull();
		await fireEvent.press(screen.getByRole("button", { name: "Abandonner la partie en cours" }));
		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
		expect(screen.queryByText(/sur un jeu qui n'existe plus/)).toBeNull();
	});
});
