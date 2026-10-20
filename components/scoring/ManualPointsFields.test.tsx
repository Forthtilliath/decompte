import { render } from "@testing-library/react-native";
import { ManualPointsFields } from "@/components/scoring/ManualPointsFields";
import { tapStepper } from "@/test/interactions";

describe("ManualPointsFields", () => {
	it("interdit les valeurs négatives par défaut", async () => {
		const onChange = jest.fn();
		await render(<ManualPointsFields points={0} color="#f00" onChange={onChange} />);
		await tapStepper("Diminuer");
		expect(onChange).toHaveBeenLastCalledWith(0);
	});

	// Régression : `min={undefined}` était écrasé par le `min = 0` par défaut du stepper, la case
	// « Autoriser les valeurs négatives » d'une catégorie n'avait donc aucun effet.
	it("autorise les valeurs négatives quand la catégorie le permet", async () => {
		const onChange = jest.fn();
		await render(<ManualPointsFields points={0} color="#f00" allowNegative onChange={onChange} />);
		await tapStepper("Diminuer");
		expect(onChange).toHaveBeenLastCalledWith(-1);
	});

	describe("valeur par unité (ex. −4 par calamité)", () => {
		it("avance par pas de la valeur et descend sous zéro", async () => {
			const onChange = jest.fn();
			await render(
				<ManualPointsFields points={-4} color="#f00" unitValue={-4} onChange={onChange} />,
			);
			await tapStepper("Diminuer");
			expect(onChange).toHaveBeenLastCalledWith(-8);
		});

		it("avance par pas d'une unité positive sans descendre sous zéro", async () => {
			const onChange = jest.fn();
			await render(
				<ManualPointsFields points={4} color="#f00" unitValue={4} onChange={onChange} />,
			);
			await tapStepper("Augmenter");
			expect(onChange).toHaveBeenLastCalledWith(8);
			await tapStepper("Diminuer");
			await tapStepper("Diminuer");
			expect(onChange).toHaveBeenLastCalledWith(0);
		});
	});

	it("respecte le plafond de la catégorie", async () => {
		const onChange = jest.fn();
		await render(<ManualPointsFields points={10} color="#f00" max={10} onChange={onChange} />);
		await tapStepper("Augmenter");
		expect(onChange).toHaveBeenLastCalledWith(10);
	});
});
