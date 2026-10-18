import { fireEvent, screen } from "expo-router/testing-library";
import { Alert, type AlertButton } from "react-native";
import { serializeGame } from "@/lib/gameExport";
import { useGamesStore } from "@/stores/gamesStore";
import { makeCategory, makeGame } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
	(buttons as AlertButton[] | undefined)?.find((b) => b.style !== "cancel")?.onPress?.();
});

beforeEach(() => {
	alert.mockClear();
	useGamesStore.setState({ games: [] });
});

async function importText(text: string) {
	const app = await renderApp("/jeux/import");
	await fireEvent.changeText(screen.getByLabelText("Jeu partagé"), text);
	await fireEvent.press(screen.getByRole("button", { name: "Importer" }));
	return app;
}

describe("import d'un jeu partagé", () => {
	it("ajoute le jeu après confirmation et ouvre sa fiche", async () => {
		const shared = serializeGame(
			makeGame({
				name: "Azul",
				categories: [makeCategory({ id: "id-de-l-autre-appareil", label: "Murs" })],
			}),
		);
		const app = await importText(shared);

		expect(alert).toHaveBeenCalledWith(
			"Importer « Azul » ?",
			"1 catégorie. Le jeu sera ajouté à ta liste, tu pourras le modifier ensuite.",
			expect.any(Array),
		);
		const [game] = useGamesStore.getState().games;
		expect(game.name).toBe("Azul");
		// Rien de ce qui vient d'ailleurs n'est repris tel quel : ids recréés localement.
		expect(game.categories[0].id).not.toBe("id-de-l-autre-appareil");
		expect(app.getPathname()).toBe(`/jeux/${game.id}`);
	});

	it("refuse un texte invalide sans rien ajouter", async () => {
		await importText('{"format":"decompte-game","version":1,"game":{"name":""}}');
		expect(alert).toHaveBeenCalledWith("Import impossible", expect.any(String));
		expect(useGamesStore.getState().games).toEqual([]);
	});

	it("refuse un texte qui n'est pas du JSON", async () => {
		await importText("bonjour");
		expect(alert).toHaveBeenCalledWith(
			"Import impossible",
			"Ce texte n'est pas un jeu Décompte (format illisible).",
		);
		expect(useGamesStore.getState().games).toEqual([]);
	});
});
