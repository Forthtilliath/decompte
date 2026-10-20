import { fireEvent, screen } from "expo-router/testing-library";
import { Alert, type AlertButton } from "react-native";
import { replaceAllData } from "@/lib/backup";
import {
	BACKUP_APP_ID,
	BACKUP_DATA_VERSION,
	type BackupData,
	parseBackup,
} from "@/lib/backupSchema";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { makeCategory, makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

/** Répond à chaque boîte de dialogue en choisissant le bouton qui n'est pas « Annuler ». */
const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
	(buttons as AlertButton[] | undefined)?.find((b) => b.style !== "cancel")?.onPress?.();
});

const azul = makeGame({
	id: "azul",
	name: "Azul",
	minPlayers: 2,
	maxPlayers: 4,
	categories: [makeCategory({ id: "murs", label: "Murs" })],
});
const alice = makePlayer({ id: "alice", name: "Alice" });
const bob = makePlayer({ id: "bob", name: "Bob" });

/** Sauvegarde venue d'un autre téléphone : le jeu y est renommé, avec une partie déjà jouée. */
function backupFile(overrides: Partial<BackupData> = {}): string {
	return JSON.stringify({
		app: BACKUP_APP_ID,
		dataVersion: BACKUP_DATA_VERSION,
		exportedAt: Date.UTC(2026, 9, 18),
		games: [{ ...azul, name: "Azul (famille)" }],
		players: [alice, bob],
		groups: [],
		sessions: [
			makeSession({
				id: "ancienne",
				gameDefId: "azul",
				playerIds: ["alice", "bob"],
				entries: { alice: makeEntry("alice", { murs: 20 }), bob: makeEntry("bob", { murs: 15 }) },
			}),
		],
		...overrides,
	});
}

/** Ce que fait le gestionnaire de sauvegarde à la restauration : relecture validée, puis `apply`. */
const restore = (text: string) => replaceAllData(parseBackup(text));

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

beforeEach(() => {
	alert.mockClear();
	useGamesStore.setState({ games: [azul] });
	usePlayersStore.setState({ players: [alice, bob] });
	useGroupsStore.setState({ groups: [] });
	useHistoryStore.setState({ sessions: [] });
	useSessionStore.getState().resetSession();
	// La partie en cours, propre à l'appareil, ne fait pas partie de la sauvegarde.
	useSessionStore.getState().startNewSession("azul", ["alice", "bob"]);
});

describe("restauration d'une sauvegarde pendant une partie", () => {
	it("reprend la partie en cours sur le jeu restauré et l'enregistre avec l'historique restauré", async () => {
		restore(backupFile());
		const app = await renderApp("/jeux");

		await press("Reprendre la partie en cours (Azul (famille))");
		expect(app.getPathname()).toBe("/jeux/play/murs");
		expect(await screen.findByText("Étape 1 / 1")).toBeOnTheScreen();
		const [aliceField, bobField] = screen.getAllByDisplayValue("0");
		await fireEvent.changeText(aliceField, "12");
		await fireEvent.changeText(bobField, "8");

		await press("Voir les résultats");
		await press("Terminer et enregistrer la partie");

		expect(app.getPathname()).toBe("/jeux");
		const sessions = useHistoryStore.getState().sessions;
		expect(sessions.map((s) => s.id)).toContain("ancienne");
		expect(sessions).toHaveLength(2);
		const saved = sessions.find((s) => s.id !== "ancienne");
		expect(saved?.gameDefId).toBe("azul");
		expect(saved?.entries.alice.scores).toEqual({ murs: 12 });
	});

	it("signale la partie en cours dont le jeu n'est pas dans la sauvegarde", async () => {
		restore(backupFile({ games: [makeGame({ id: "belote", name: "Belote" })], sessions: [] }));
		await renderApp("/jeux");

		expect(screen.getByText(/sur un jeu qui n'existe plus/)).toBeOnTheScreen();
		expect(screen.queryByRole("button", { name: /Reprendre/ })).toBeNull();
		await press("Abandonner la partie en cours");
		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
	});

	it("n'applique rien d'une sauvegarde invalide : la partie en cours reste reprenable", async () => {
		const corrupted = backupFile({ players: [{ ...alice, name: "" }] });
		expect(() => restore(corrupted)).toThrow();
		await renderApp("/jeux");

		expect(useGamesStore.getState().games).toEqual([azul]);
		expect(
			screen.getByRole("button", { name: "Reprendre la partie en cours (Azul)" }),
		).toBeOnTheScreen();
	});
});
