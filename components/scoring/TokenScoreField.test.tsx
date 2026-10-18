import { fireEvent, render, screen } from "@testing-library/react-native";
import { TokenScoreField } from "@/components/scoring/TokenScoreField";
import { tapStepper } from "@/test/interactions";

const VICTORY = { label: "Victoire", value: 3 };
const DEFEAT = { label: "Défaite", value: -1 };

describe("TokenScoreField", () => {
	it("reste à 0 minimum quand tous les jetons sont positifs", async () => {
		const onChange = jest.fn();
		await render(
			<TokenScoreField
				points={0}
				color="#f00"
				label="Militaire"
				tokens={[VICTORY]}
				onChange={onChange}
			/>,
		);
		await tapStepper("Diminuer");
		expect(onChange).toHaveBeenLastCalledWith(0);
	});

	it("autorise un total négatif dès qu'un jeton vaut des points négatifs", async () => {
		const onChange = jest.fn();
		await render(
			<TokenScoreField
				points={0}
				color="#f00"
				label="Militaire"
				tokens={[VICTORY, DEFEAT]}
				onChange={onChange}
			/>,
		);
		await tapStepper("Diminuer");
		expect(onChange).toHaveBeenLastCalledWith(-1);
	});

	it("remplace le total par celui de la calculette de jetons", async () => {
		const onChange = jest.fn();
		await render(
			<TokenScoreField
				points={0}
				color="#f00"
				label="Militaire"
				tokens={[VICTORY, DEFEAT]}
				onChange={onChange}
			/>,
		);
		await fireEvent.press(screen.getByText("Compter par jetons"));
		await tapStepper("Augmenter Victoire");
		await tapStepper("Augmenter Victoire");
		await tapStepper("Augmenter Défaite");
		await fireEvent.press(screen.getByRole("button", { name: "Valider" }));
		expect(onChange).toHaveBeenLastCalledWith(5);
	});
});
