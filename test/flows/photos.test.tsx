import { deleteFileQuietly } from "@forthtilliath/react-native-kit/utils/files/appFiles";
import * as ImagePicker from "expo-image-picker";
import { fireEvent, screen, waitFor } from "expo-router/testing-library";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useThemeStore } from "@/stores/themeStore";
import { mockAlert } from "@/test/alerts";
import { makeGame, makePlayer } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

const { spy: alert, choose } = mockAlert();
const PHOTO = "file:///documents/avatars/alice.jpg";

beforeEach(() => {
	alert.mockClear();
	jest.mocked(deleteFileQuietly).mockClear();
	choose();
	usePlayersStore.setState({
		players: [makePlayer({ id: "alice", name: "Alice", avatarUri: PHOTO })],
	});
	useGroupsStore.setState({ groups: [] });
	useThemeStore.setState({ mode: "dark" });
});

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

describe("photo des joueurs", () => {
	it("crée un joueur avec une photo prise sur le moment", async () => {
		jest.mocked(ImagePicker.launchCameraAsync).mockResolvedValueOnce({
			canceled: false,
			assets: [{ uri: "file:///cache/bob.jpg", width: 100, height: 100 }],
		});
		await renderApp("/players/new");
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), "Bob");
		choose("Prendre une photo");
		await press("Ajouter une photo du joueur");
		expect(
			await screen.findByRole("button", { name: "Changer la photo du joueur" }),
		).toBeOnTheScreen();
		await press("Créer le joueur");

		const bob = usePlayersStore.getState().players.find((p) => p.name === "Bob");
		expect(bob?.avatarUri).toBe("file:///documents/avatars/bob.jpg");
	});

	it("remplace la photo et supprime l'ancienne", async () => {
		jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
			canceled: false,
			assets: [{ uri: "file:///cache/alice-2.jpg", width: 100, height: 100 }],
		});
		await renderApp("/players/alice");
		choose("Choisir dans la galerie");
		await press("Changer la photo du joueur");
		await waitFor(() => expect(screen.getByRole("button", { name: "Enregistrer" })).toBeEnabled());
		await press("Enregistrer");

		await waitFor(() =>
			expect(usePlayersStore.getState().players[0].avatarUri).toBe(
				"file:///documents/avatars/alice-2.jpg",
			),
		);
		expect(deleteFileQuietly).toHaveBeenCalledWith(PHOTO);
	});

	it("retire la photo : les initiales reviennent", async () => {
		await renderApp("/players/alice");
		await press("Retirer la photo");
		// Initiales masquées au lecteur d'écran (le nom est écrit à côté) : cherchées quand même.
		expect(screen.getByText("AL", { includeHiddenElements: true })).toBeOnTheScreen();
		await press("Enregistrer");

		expect(usePlayersStore.getState().players[0].avatarUri).toBeUndefined();
		expect(deleteFileQuietly).toHaveBeenCalledWith(PHOTO);
	});

	it("garde la photo tant que le formulaire n'est pas enregistré", async () => {
		await renderApp("/players/alice");
		await press("Retirer la photo");

		expect(usePlayersStore.getState().players[0].avatarUri).toBe(PHOTO);
		expect(deleteFileQuietly).not.toHaveBeenCalled();
	});

	it("supprime la photo avec le joueur", async () => {
		await renderApp("/players/alice");
		choose("Supprimer");
		await press("Supprimer le joueur");

		expect(usePlayersStore.getState().players).toEqual([]);
		expect(deleteFileQuietly).toHaveBeenCalledWith(PHOTO);
	});
});

describe("notes et photo à la fin d'une partie", () => {
	it("les ajoute au classement final et les garde dans l'historique", async () => {
		useGamesStore.setState({ games: [makeGame({ id: "azul", name: "Azul" })] });
		useHistoryStore.setState({ sessions: [] });
		useSessionStore.getState().startNewSession("azul", ["alice"]);
		jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
			canceled: false,
			assets: [{ uri: "file:///cache/table.jpg", width: 100, height: 100 }],
		});
		await renderApp("/jeux/play/results");

		await fireEvent.changeText(screen.getByLabelText("Notes"), "Revanche dimanche");
		choose("Choisir dans la galerie");
		await press("Ajouter une photo de la table");
		expect(await screen.findByRole("button", { name: "Changer la photo" })).toBeOnTheScreen();
		// Sans quitter le champ des notes : elles sont déjà enregistrées.
		await press("Terminer et enregistrer la partie");

		expect(useHistoryStore.getState().sessions[0]).toMatchObject({
			notes: "Revanche dimanche",
			// Dossier fixé par le mock de test/setup ; le vrai (« parties ») : lib/sessionPhotos.test.
			photoUri: "file:///documents/avatars/table.jpg",
		});
	});
});
