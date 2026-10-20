import { act, screen } from "expo-router/testing-library";
import { serializeGame } from "@/lib/gameExport";
import { toAsciiJson } from "@/lib/qrCode";
import { useGamesStore } from "@/stores/gamesStore";
import { mockAlert } from "@/test/alerts";
import { makeCategory, makeGame } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

// La caméra n'existe pas sous Jest : l'aperçu est remplacé par un composant qui retient sa
// fonction de lecture, appelée comme si un QR code passait devant l'objectif.
let mockScan: ((result: { data: string }) => void) | undefined;
let mockGranted = true;
jest.mock("expo-camera", () => ({
	CameraView: (props: { onBarcodeScanned: (result: { data: string }) => void }) => {
		mockScan = props.onBarcodeScanned;
		return null;
	},
	useCameraPermissions: () => [{ granted: mockGranted, canAskAgain: true }, jest.fn()],
}));

jest.setTimeout(30_000);

beforeEach(() => {
	mockScan = undefined;
	mockGranted = true;
	useGamesStore.setState({ games: [] });
});

const sharedGame = makeGame({
	name: "Trésor des Pirates",
	categories: [makeCategory({ label: "Pièces d'or" })],
});

describe("scanner le QR code d'un jeu", () => {
	it("importe le jeu lu une seule fois, accents compris, après confirmation", async () => {
		const alert = mockAlert();
		const app = await renderApp("/jeux/scanner");
		await act(() => {
			// Lu plusieurs fois de suite, comme le fait la caméra.
			mockScan?.({ data: toAsciiJson(serializeGame(sharedGame)) });
			mockScan?.({ data: toAsciiJson(serializeGame(sharedGame)) });
		});

		expect(alert.spy).toHaveBeenCalledTimes(1);
		const games = useGamesStore.getState().games;
		expect(games.map((g) => g.name)).toEqual(["Trésor des Pirates"]);
		expect(games[0].categories[0].label).toBe("Pièces d'or");
		expect(app.getPathname()).toBe(`/jeux/${games[0].id}`);
	});

	it("refuse un QR code qui n'est pas un jeu, puis permet de réessayer", async () => {
		const alert = mockAlert();
		alert.spy.mockClear();
		await renderApp("/jeux/scanner");
		await act(() => mockScan?.({ data: "https://exemple.com" }));
		await act(() => mockScan?.({ data: "{}" }));

		expect(alert.spy).toHaveBeenCalledTimes(2);
		expect(alert.spy).toHaveBeenCalledWith(
			"Import impossible",
			expect.any(String),
			expect.any(Array),
		);
		expect(useGamesStore.getState().games).toEqual([]);
	});

	it("demande l'appareil photo avant d'afficher l'aperçu", async () => {
		mockGranted = false;
		await renderApp("/jeux/scanner");
		expect(screen.getByRole("button", { name: "Autoriser l'appareil photo" })).toBeOnTheScreen();
		expect(mockScan).toBeUndefined();
	});
});
