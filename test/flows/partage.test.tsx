import { shareViewAsImage } from "@forthtilliath/react-native-kit/utils/helpers/shareViewAsImage";
import { fireEvent, screen, waitFor, within } from "expo-router/testing-library";
import { Alert } from "react-native";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

// Pas de capture d'écran sous Jest : on vérifie seulement la vue qui serait capturée.
jest.mock("@forthtilliath/react-native-kit/utils/helpers/shareViewAsImage", () => ({
	shareViewAsImage: jest.fn(() => Promise.resolve()),
}));
const share = jest.mocked(shareViewAsImage);
const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

const PLAYED_AT = Date.UTC(2026, 9, 19, 12);

beforeEach(() => {
	share.mockClear();
	alert.mockClear();
	usePlayersStore.setState({
		players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
	});
	useGamesStore.setState({ games: [makeGame({ id: "azul", name: "Azul" })] });
	useHistoryStore.setState({
		sessions: [
			makeSession({
				id: "s1",
				gameDefId: "azul",
				createdAt: PLAYED_AT,
				playerIds: ["alice", "bob"],
				entries: { alice: makeEntry("alice", { murs: 10 }), bob: makeEntry("bob", { murs: 20 }) },
			}),
		],
	});
});

const IMAGE = "session-share-image";
/** L'image est masquée aux lecteurs d'écran : les requêtes doivent l'inclure explicitement. */
const HIDDEN = { includeHiddenElements: true };

const pressShare = () => fireEvent.press(screen.getByRole("button", { name: "Partager en image" }));

describe("partage d'une partie en image", () => {
	it("capture le nom du jeu, la date et le classement, puis retire l'image", async () => {
		let captured: string[] = [];
		let attached = false;
		share.mockImplementationOnce(async (ref) => {
			attached = ref.current != null;
			captured = within(screen.getByTestId(IMAGE, HIDDEN))
				.getAllByText(/./, HIDDEN)
				.map((text) => String(text.props.children));
		});
		await renderApp("/history/s1");
		expect(screen.queryByTestId(IMAGE, HIDDEN)).not.toBeOnTheScreen();
		await pressShare();

		await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
		expect(attached).toBe(true);
		expect(captured).toEqual(expect.arrayContaining(["Azul", "Bob", "Alice"]));
		expect(captured).toContainEqual(expect.stringMatching(/19 octobre 2026/));
		expect(share.mock.calls[0][1]).toEqual({ dialogTitle: "Partager la partie" });
		await waitFor(() => expect(screen.queryByTestId(IMAGE, HIDDEN)).not.toBeOnTheScreen());
	});

	it("affiche l'erreur quand la capture n'est pas disponible", async () => {
		share.mockRejectedValueOnce(new Error("Le partage en image n'est pas disponible."));
		await renderApp("/history/s1");
		await pressShare();

		await waitFor(() =>
			expect(alert).toHaveBeenCalledWith(
				"Partage impossible",
				"Le partage en image n'est pas disponible.",
			),
		);
		expect(screen.getByRole("button", { name: "Partager en image" })).toBeEnabled();
	});
});
