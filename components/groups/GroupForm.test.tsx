import { fireEvent, render, screen } from "@testing-library/react-native";
import { GroupForm } from "@/components/groups/GroupForm";
import { usePlayersStore } from "@/stores/playersStore";
import { makePlayer } from "@/test/factories";

describe("GroupForm", () => {
	beforeEach(() => {
		usePlayersStore.setState({
			players: [
				makePlayer({ id: "a", name: "Alice" }),
				makePlayer({ id: "b", name: "Bob" }),
				makePlayer({ id: "z", name: "Zed", isArchived: true }),
			],
		});
	});

	it("ne propose que les joueurs actifs", async () => {
		await render(<GroupForm submitLabel="Créer" onSubmit={jest.fn()} />);
		expect(screen.getAllByRole("checkbox")).toHaveLength(2);
		expect(screen.queryByRole("checkbox", { name: "Zed" })).not.toBeOnTheScreen();
	});

	it("exige un nom et au moins un membre", async () => {
		await render(<GroupForm submitLabel="Créer" onSubmit={jest.fn()} />);
		await fireEvent.changeText(screen.getByLabelText("Nom du groupe"), "Jeudi");
		expect(screen.getByRole("button", { name: "Créer" })).toBeDisabled();
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		expect(screen.getByRole("button", { name: "Créer" })).toBeEnabled();
	});

	it("enregistre le nom nettoyé et les membres cochés", async () => {
		const onSubmit = jest.fn();
		await render(<GroupForm initialPlayerIds={["a"]} submitLabel="Créer" onSubmit={onSubmit} />);
		await fireEvent.changeText(screen.getByLabelText("Nom du groupe"), " Jeudi ");
		await fireEvent.press(screen.getByRole("checkbox", { name: "Bob" }));
		await fireEvent.press(screen.getByRole("checkbox", { name: "Alice" }));
		await fireEvent.press(screen.getByRole("button", { name: "Créer" }));
		expect(onSubmit).toHaveBeenCalledWith({ name: "Jeudi", playerIds: ["b"] });
	});
});
