import { fireEvent, render, screen } from "@testing-library/react-native";
import { Alert } from "react-native";
import { GameBuilderForm } from "@/components/games/GameBuilderForm";
import { makeCategory, makeGame } from "@/test/factories";

const alert = jest.spyOn(Alert, "alert").mockImplementation(() => {});

beforeEach(() => alert.mockClear());

async function renderForm(initial?: Parameters<typeof GameBuilderForm>[0]["initial"]) {
	const onSubmit = jest.fn();
	await render(
		<GameBuilderForm initial={initial} submitLabel="Créer le jeu" onSubmit={onSubmit} />,
	);
	return onSubmit;
}

const type = (label: string, text: string, index = 0) =>
	fireEvent.changeText(screen.getAllByLabelText(label)[index], text);
const press = (name: string, index = 0) =>
	fireEvent.press(screen.getAllByRole("button", { name })[index]);
const pickKind = (kind: string) => fireEvent.press(screen.getByRole("radio", { name: kind }));

describe("GameBuilderForm", () => {
	it("refuse un jeu sans nom et n'enregistre rien", async () => {
		const onSubmit = await renderForm();
		await press("Créer le jeu");
		expect(alert).toHaveBeenCalledWith("Nom manquant", "Donne un nom au jeu.");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("refuse une catégorie sans nom", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "Azul");
		await press("Créer le jeu");
		expect(alert).toHaveBeenCalledWith("Catégorie incomplète", "Donne un nom à chaque catégorie.");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("crée un jeu simple avec les bornes saisies", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", " Azul ");
		await type("Joueurs min.", "2");
		await type("Joueurs max.", "4");
		await type("Nom de la catégorie", "Murs");
		await press("Créer le jeu");

		expect(alert).not.toHaveBeenCalled();
		expect(onSubmit).toHaveBeenCalledWith({
			name: "Azul",
			minPlayers: 2,
			maxPlayers: 4,
			categories: [
				{ label: "Murs", color: "#ef4444", brick: { kind: "manual", allowNegative: false } },
			],
		});
	});

	it("choisit la couleur d'une catégorie", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "Azul");
		await type("Nom de la catégorie", "Murs");
		await press("Couleur de la catégorie, Rouge");
		await fireEvent.press(screen.getByRole("radio", { name: "Indigo" }));
		expect(
			screen.getByRole("button", { name: "Couleur de la catégorie, Indigo" }),
		).toBeOnTheScreen();

		await press("Créer le jeu");
		expect(onSubmit.mock.calls[0][0].categories[0].color).toBe("#6366f1");
	});

	it("donne à une nouvelle catégorie une couleur pas encore prise", async () => {
		await renderForm();
		await press("Couleur de la catégorie, Rouge");
		await fireEvent.press(screen.getByRole("radio", { name: "Orange" }));
		await press("Ajouter une catégorie");
		// Rouge est libre à nouveau : la nouvelle catégorie le reprend.
		expect(
			screen.getByRole("button", { name: "Couleur de la catégorie, Rouge" }),
		).toBeOnTheScreen();
	});

	it("règle une catégorie « Nombre » : négatif et plafond", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "Belote");
		await type("Nom de la catégorie", "Plis");
		await fireEvent(screen.getByLabelText("Autoriser les valeurs négatives"), "valueChange", true);
		await fireEvent(screen.getByLabelText("Plafonner"), "valueChange", true);
		await type("Valeur maximum", "162");
		await press("Créer le jeu");

		expect(onSubmit.mock.calls[0][0].categories[0].brick).toEqual({
			kind: "manual",
			allowNegative: true,
			max: 162,
		});
	});

	it("règle une catégorie « Nombre » comptée par unités négatives", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "It's a Wonderful Kingdom");
		await type("Nom de la catégorie", "Calamités");
		await fireEvent(screen.getByLabelText("Compter par unités"), "valueChange", true);
		await type("Points par unité", "-");
		await type("Points par unité", "-4");
		await press("Créer le jeu");

		expect(onSubmit.mock.calls[0][0].categories[0].brick).toEqual({
			kind: "manual",
			allowNegative: false,
			unitValue: -4,
		});
	});

	it("crée une catégorie « Jetons » et exige au moins un jeton nommé", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "7 Wonders");
		await type("Nom de la catégorie", "Militaire");
		await pickKind("Jetons");

		await press("Créer le jeu");
		expect(alert).toHaveBeenLastCalledWith(
			"Jetons manquants",
			"Ajoute au moins un jeton aux catégories de type « Jetons ».",
		);

		await press("Ajouter un jeton");
		await press("Ajouter un jeton");
		await type("Libellé", "Victoire", 0);
		await type("Valeur", "5", 0);
		await type("Libellé", "Défaite", 1);
		await type("Valeur", "-1", 1);
		await press("Créer le jeu");

		expect(onSubmit.mock.calls[0][0].categories[0].brick).toEqual({
			kind: "tokens",
			tokens: [
				{ label: "Victoire", value: 5 },
				{ label: "Défaite", value: -1 },
			],
		});
	});

	it("supprime un jeton", async () => {
		await renderForm();
		await pickKind("Jetons");
		await press("Ajouter un jeton");
		await press("Ajouter un jeton");
		await press("Supprimer ce jeton", 0);
		expect(screen.getAllByLabelText("Libellé")).toHaveLength(1);
	});

	it("crée une catégorie « Choix » et refuse deux valeurs au même score", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "Jeu");
		await type("Nom de la catégorie", "Palier");
		await pickKind("Choix");
		await press("Ajouter une valeur");
		await press("Ajouter une valeur");
		await type("Libellé", "Bas", 0);
		await type("Libellé", "Haut", 1);

		await press("Créer le jeu");
		expect(alert).toHaveBeenLastCalledWith(
			"Scores en double",
			"Deux valeurs d'une catégorie « Choix » ne peuvent pas rapporter le même score.",
		);

		await type("Score", "10", 1);
		await press("Créer le jeu");
		const brick = onSubmit.mock.calls[0][0].categories[0].brick;
		expect(brick.options.map((o: { label: string; value: number }) => [o.label, o.value])).toEqual([
			["Bas", 0],
			["Haut", 10],
		]);
	});

	it("crée une catégorie « Oui / Non »", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "Jeu");
		await type("Nom de la catégorie", "Plus longue route");
		await pickKind("Oui / Non");
		await type("Score si Oui", "2");
		await press("Créer le jeu");
		expect(onSubmit.mock.calls[0][0].categories[0].brick).toEqual({
			kind: "boolean",
			yesValue: 2,
			noValue: 0,
		});
	});

	it("ajoute et retire des catégories", async () => {
		const onSubmit = await renderForm();
		await type("Nom du jeu", "Jeu");
		await press("Ajouter une catégorie");
		expect(screen.getAllByLabelText("Nom de la catégorie")).toHaveLength(2);

		await press("Supprimer la catégorie", 0);
		await press("Supprimer la catégorie", 0);
		await press("Créer le jeu");
		expect(alert).toHaveBeenLastCalledWith(
			"Aucune catégorie",
			"Ajoute au moins une catégorie de score.",
		);
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("pré-remplit un jeu existant et garde l'id de ses catégories (historique)", async () => {
		const game = makeGame({
			name: "Azul",
			minPlayers: 2,
			maxPlayers: 4,
			categories: [makeCategory({ id: "murs-id", label: "Murs", color: "#14b8a6" })],
		});
		const onSubmit = await renderForm(game);
		expect(
			screen.getByRole("button", { name: "Couleur de la catégorie, Sarcelle" }),
		).toBeOnTheScreen();

		expect(screen.getByLabelText("Nom du jeu")).toHaveDisplayValue("Azul");
		await type("Nom de la catégorie", "Murs complets");
		await press("Ajouter une catégorie");
		await type("Nom de la catégorie", "Bonus", 1);
		await press("Créer le jeu");

		const { categories } = onSubmit.mock.calls[0][0];
		expect(categories[0]).toMatchObject({
			id: "murs-id",
			label: "Murs complets",
			color: "#14b8a6",
		});
		expect(categories[1].id).toBeUndefined();
		expect(categories[1].color).toBe("#ef4444");
	});
});
