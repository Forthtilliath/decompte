import { fireEvent, screen } from "expo-router/testing-library";
import { Linking } from "react-native";
import { APP_INFO, LINKS } from "@/constants/app";
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
	useThemeStore.setState({ mode: "dark" });
	useGamesStore.setState({ games: [makeGame()] });
	usePlayersStore.setState({ players: [makePlayer({ id: "alice" })] });
	useGroupsStore.setState({ groups: [makeGroup({ playerIds: ["alice"] })] });
	useHistoryStore.setState({ sessions: [makeSession({ playerIds: ["alice"] })] });
	useSessionStore.getState().startNewSession("game1", ["alice"]);
});

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
		await fireEvent.press(screen.getByRole("button", { name: "Apparence, Sombre" }));
		expect(app.getPathname()).toBe("/reglages/apparence");

		await fireEvent.press(screen.getByRole("radio", { name: "Clair" }));
		expect(useThemeStore.getState().mode).toBe("light");
		expect(screen.getByRole("radio", { name: "Clair" })).toBeSelected();
	});

	it("ouvre la page de don et le suivi des bugs", async () => {
		await renderApp("/reglages/soutenir");
		await fireEvent.press(screen.getByText("M'offrir un café"));
		expect(openURL).toHaveBeenCalledWith(LINKS.donation);

		await fireEvent.press(screen.getByText("Signaler un bug ou proposer une idée"));
		expect(openURL).toHaveBeenLastCalledWith(LINKS.issues);
	});

	it("efface toutes les données après confirmation", async () => {
		await renderApp("/reglages/zone-dangereuse");
		await fireEvent.press(screen.getByRole("button", { name: "Effacer toutes les données" }));

		expect(alert).toHaveBeenCalledWith(
			"Effacer toutes les données ?",
			expect.any(String),
			expect.any(Array),
		);
		expect(useGamesStore.getState().games).toEqual([]);
		expect(usePlayersStore.getState().players).toEqual([]);
		expect(useGroupsStore.getState().groups).toEqual([]);
		expect(useHistoryStore.getState().sessions).toEqual([]);
		expect(useSessionStore.getState().hasOngoingSession()).toBe(false);
	});

	it("ne touche à rien si l'effacement est annulé", async () => {
		choose("Annuler");
		await renderApp("/reglages/zone-dangereuse");
		await fireEvent.press(screen.getByRole("button", { name: "Effacer toutes les données" }));

		expect(useGamesStore.getState().games).toHaveLength(1);
		expect(useHistoryStore.getState().sessions).toHaveLength(1);
	});
});
