import { fireEvent, render, screen } from "@testing-library/react-native";
import { PlayerForm } from "@/components/players/PlayerForm";

describe("PlayerForm", () => {
	it("désactive l'enregistrement tant que le nom est vide", async () => {
		await render(<PlayerForm submitLabel="Créer" onSubmit={jest.fn()} />);
		expect(screen.getByRole("button", { name: "Créer" })).toBeDisabled();
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), "   ");
		expect(screen.getByRole("button", { name: "Créer" })).toBeDisabled();
	});

	it("enregistre le nom nettoyé", async () => {
		const onSubmit = jest.fn();
		await render(<PlayerForm submitLabel="Créer" onSubmit={onSubmit} />);
		await fireEvent.changeText(screen.getByLabelText("Nom du joueur"), "  Alice ");
		await fireEvent.press(screen.getByRole("button", { name: "Créer" }));
		expect(onSubmit).toHaveBeenCalledWith({ name: "Alice" });
	});

	it("pré-remplit le nom d'un joueur existant", async () => {
		await render(<PlayerForm initialName="Bob" submitLabel="Enregistrer" onSubmit={jest.fn()} />);
		expect(screen.getByLabelText("Nom du joueur")).toHaveDisplayValue("Bob");
	});
});
