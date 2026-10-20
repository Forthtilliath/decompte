import { pruneAppDirectory } from "@forthtilliath/react-native-kit/utils/files/appFiles";
import { fireEvent, screen } from "expo-router/testing-library";
import { Linking } from "react-native";
import { APP_INFO, LINKS } from "@/constants/app";
import { backup } from "@/lib/backup";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useThemeStore } from "@/stores/themeStore";
import { mockAlert } from "@/test/alerts";
import { makeGame, makeGroup, makePlayer, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

const { spy: alert, choose } = mockAlert();
const openURL = jest.spyOn(Linking, "openURL").mockResolvedValue();

beforeEach(() => {
	alert.mockClear();
	openURL.mockClear();
	choose();
	useThemeStore.setState({ mode: "dark", backgrounds: {} });
	useGamesStore.setState({ games: [makeGame()] });
	usePlayersStore.setState({ players: [makePlayer({ id: "alice" })] });
	useGroupsStore.setState({ groups: [makeGroup({ playerIds: ["alice"] })] });
	useHistoryStore.setState({ sessions: [makeSession({ playerIds: ["alice"] })] });
	useSessionStore.getState().startNewSession("game1", ["alice"]);
});

// Pas de `jest.restoreAllMocks()` : il retirerait aussi les remplaçants d'Alert et de Linking.
const backupSpies: jest.SpyInstance[] = [];
afterEach(() => {
	for (const spy of backupSpies.splice(0)) spy.mockRestore();
});

/** Compte Google relié, sans passer par la connexion réelle. */
function linkCloud(disconnect: () => Promise<void>) {
	const state = backup.getState();
	backupSpies.push(
		jest.spyOn(backup, "getState").mockReturnValue({ ...state, cloudAccount: { email: "a@b.c" } }),
	);
	const spy = jest.spyOn(backup, "disconnectCloud").mockImplementation(disconnect);
	backupSpies.push(spy);
	return spy;
}

/** Tape le mot de confirmation (en minuscules : la casse ne compte pas) puis efface. */
async function confirmClear() {
	await fireEvent.changeText(screen.getByLabelText("Tape EFFACER pour confirmer"), " effacer ");
	await fireEvent.press(screen.getByRole("button", { name: "Effacer toutes les données" }));
}

describe("réglages", () => {
	it("liste les sections et la version installée", async () => {
		await renderApp("/reglages");
		for (const label of [
			"Apparence",
			"Sauvegarde et restauration",
			"Mises à jour",
			"Soutenir le projet",
			"À propos",
			"Zone dangereuse",
		]) {
			expect(screen.getByText(label)).toBeOnTheScreen();
		}
		expect(screen.getByText(`${APP_INFO.name} · v${APP_INFO.version}`)).toBeOnTheScreen();
	});

	it("passe en thème clair depuis le menu et le garde", async () => {
		const app = await renderApp("/reglages");
		await fireEvent.press(
			screen.getByRole("button", { name: "Apparence, Sombre, fond bleu nuit" }),
		);
		expect(app.getPathname()).toBe("/reglages/apparence");

		await fireEvent.press(screen.getByRole("radio", { name: "Clair" }));
		expect(useThemeStore.getState().mode).toBe("light");
		expect(screen.getByRole("radio", { name: "Clair" })).toBeSelected();
	});

	it("change la couleur de fond du thème affiché, sans toucher à l'autre", async () => {
		await renderApp("/reglages/apparence");
		expect(screen.getByRole("radio", { name: "Bleu nuit" })).toBeSelected();

		await fireEvent.press(screen.getByRole("radio", { name: "Tapis vert" }));
		expect(screen.getByRole("radio", { name: "Tapis vert" })).toBeSelected();

		// Le thème clair propose ses propres fonds et garde celui d'origine.
		await fireEvent.press(screen.getByRole("radio", { name: "Clair" }));
		expect(screen.queryByRole("radio", { name: "Tapis vert" })).toBeNull();
		expect(screen.getByRole("radio", { name: "Carton" })).toBeSelected();
		expect(useThemeStore.getState().backgrounds).toEqual({ dark: "tapis" });
	});

	it("ouvre la page de don et le suivi des bugs", async () => {
		await renderApp("/reglages/soutenir");
		await fireEvent.press(screen.getByText("M'offrir un café"));
		expect(openURL).toHaveBeenCalledWith(LINKS.donation);

		await fireEvent.press(screen.getByText("Signaler un bug ou proposer une idée"));
		expect(openURL).toHaveBeenLastCalledWith(LINKS.issues);
	});

	it("efface toutes les données une fois EFFACER tapé", async () => {
		await renderApp("/reglages/zone-dangereuse");
		await confirmClear();

		expect(useGamesStore.getState().games).toEqual([]);
		expect(usePlayersStore.getState().players).toEqual([]);
		expect(useGroupsStore.getState().groups).toEqual([]);
		expect(useHistoryStore.getState().sessions).toEqual([]);
		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
		// Les photos des joueurs et des parties partent tout de suite, pas au prochain lancement.
		expect(pruneAppDirectory).toHaveBeenCalledWith("avatars", []);
		expect(pruneAppDirectory).toHaveBeenLastCalledWith("parties", []);
	});

	it("déconnecte Google Drive avant d'effacer, pour ne pas y envoyer une copie vide", async () => {
		const disconnect = linkCloud(async () => {
			expect(useGamesStore.getState().games).toHaveLength(1);
		});
		await renderApp("/reglages/zone-dangereuse");
		expect(screen.getByText(/sa copie restera telle quelle/)).toBeOnTheScreen();
		await confirmClear();

		expect(disconnect).toHaveBeenCalledTimes(1);
		expect(useGamesStore.getState().games).toEqual([]);
	});

	it("n'efface rien si Google Drive ne se déconnecte pas", async () => {
		linkCloud(() => Promise.reject(new Error("hors ligne")));
		await renderApp("/reglages/zone-dangereuse");
		await confirmClear();

		expect(alert).toHaveBeenLastCalledWith("Rien n'a été effacé", expect.any(String));
		expect(useGamesStore.getState().games).toHaveLength(1);
		expect(useHistoryStore.getState().sessions).toHaveLength(1);
	});

	it("ne laisse rien effacer sans le mot de confirmation exact", async () => {
		await renderApp("/reglages/zone-dangereuse");
		const clear = screen.getByRole("button", { name: "Effacer toutes les données" });
		expect(clear).toBeDisabled();
		await fireEvent.changeText(screen.getByLabelText("Tape EFFACER pour confirmer"), "EFFACE");
		expect(clear).toBeDisabled();
		await fireEvent.press(clear);

		expect(useGamesStore.getState().games).toHaveLength(1);
		expect(useHistoryStore.getState().sessions).toHaveLength(1);
	});
});
