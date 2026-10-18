import { fireEvent, screen } from "expo-router/testing-library";
import { Alert, type AlertButton } from "react-native";
import { useGroupsStore } from "@/stores/groupsStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useThemeStore } from "@/stores/themeStore";
import { makeGroup, makePlayer } from "@/test/factories";
import { renderApp } from "@/test/renderApp";

jest.setTimeout(30_000);

const alert = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
	(buttons as AlertButton[] | undefined)?.find((b) => b.style !== "cancel")?.onPress?.();
});

beforeEach(() => {
	alert.mockClear();
	usePlayersStore.setState({ players: [makePlayer({ id: "alice", name: "Alice" })] });
	useGroupsStore.setState({ groups: [] });
	useThemeStore.setState({ mode: "dark" });
});

const press = (name: string) => fireEvent.press(screen.getByRole("button", { name }));

describe("joueurs", () => {
	it("ajoute un joueur depuis l'onglet Joueurs", async () => {
		const app = await renderApp("/joueurs");
		await press("Ajouter un joueur");
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), "Bob");
		await press("Créer le joueur");

		expect(app.getPathname()).toBe("/joueurs");
		expect(usePlayersStore.getState().players.map((p) => p.name)).toEqual(["Alice", "Bob"]);
		expect(await screen.findByRole("button", { name: "Modifier Bob" })).toBeOnTheScreen();
		expect(alert).not.toHaveBeenCalled();
	});

	it("crée quand même un homonyme, en prévenant", async () => {
		await renderApp("/joueurs");
		await press("Ajouter un joueur");
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), " alice ");
		await press("Créer le joueur");

		expect(alert).toHaveBeenCalledWith(
			"Un joueur du même nom existe déjà",
			expect.any(String),
			expect.any(Array),
		);
		expect(usePlayersStore.getState().players).toHaveLength(2);
	});

	it("renomme puis supprime un joueur", async () => {
		await renderApp("/joueurs");
		await press("Modifier Alice");
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), "Alicia");
		await press("Enregistrer");
		expect(usePlayersStore.getState().players[0].name).toBe("Alicia");

		await press("Modifier Alicia");
		await press("Supprimer le joueur");
		expect(usePlayersStore.getState().players).toEqual([]);
		expect(await screen.findByText("Aucun joueur pour l'instant.")).toBeOnTheScreen();
	});

	it("met en favori, archive et recherche", async () => {
		usePlayersStore.setState({
			players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
		});
		await renderApp("/joueurs");

		await fireEvent.press(screen.getAllByRole("button", { name: "Ajouter aux favoris" })[1]);
		expect(usePlayersStore.getState().players.find((p) => p.id === "bob")?.isFavorite).toBe(true);
		await fireEvent.press(screen.getAllByRole("button", { name: "Archiver" })[0]);
		expect(usePlayersStore.getState().players.filter((p) => p.isArchived)).toHaveLength(1);

		await fireEvent.changeText(screen.getByPlaceholderText("Rechercher un joueur..."), "zzz");
		expect(screen.getByText("Aucun joueur ne correspond à cette recherche.")).toBeOnTheScreen();
	});
});

describe("groupes", () => {
	it("crée un groupe avec ses membres", async () => {
		usePlayersStore.setState({
			players: [makePlayer({ id: "alice", name: "Alice" }), makePlayer({ id: "bob", name: "Bob" })],
		});
		await renderApp("/joueurs");
		await press("Nouveau groupe");
		await fireEvent.changeText(screen.getByLabelText("Nom du groupe"), "Jeudi");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await press("Créer le groupe");

		expect(useGroupsStore.getState().groups).toEqual([
			expect.objectContaining({ name: "Jeudi", playerIds: ["bob"] }),
		]);
		expect(
			await screen.findByRole("button", { name: "Modifier le groupe Jeudi" }),
		).toBeOnTheScreen();
	});

	it("modifie puis supprime un groupe sans toucher aux joueurs", async () => {
		useGroupsStore.setState({
			groups: [makeGroup({ id: "g", name: "Jeudi", playerIds: ["alice"] })],
		});
		await renderApp("/joueurs");
		await press("Modifier le groupe Jeudi");
		await fireEvent.changeText(screen.getByLabelText("Nom du groupe"), "Vendredi");
		await press("Enregistrer");
		expect(useGroupsStore.getState().groups[0].name).toBe("Vendredi");

		await press("Modifier le groupe Vendredi");
		await press("Supprimer le groupe");
		expect(useGroupsStore.getState().groups).toEqual([]);
		expect(usePlayersStore.getState().players).toHaveLength(1);
	});
});

describe("réglages", () => {
	it("passe en thème clair et le garde", async () => {
		await renderApp("/reglages");
		await fireEvent.press(screen.getByRole("radio", { name: "Clair" }));
		expect(useThemeStore.getState().mode).toBe("light");
		expect(screen.getByRole("radio", { name: "Clair" })).toBeSelected();
	});
});
