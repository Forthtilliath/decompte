import { render, screen } from "@testing-library/react-native";
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
		it("en mode points, avance par pas de la valeur et descend sous zéro", async () => {
			const onChange = jest.fn();
			await render(
				<ManualPointsFields points={-4} color="#f00" unitValue={-4} onChange={onChange} />,
			);
			await tapStepper("Diminuer");
			expect(onChange).toHaveBeenLastCalledWith(-8);
		});

		it("en mode comptage, multiplie le nombre d'unités", async () => {
			const onChange = jest.fn();
			await render(
				<ManualPointsFields
					points={-8}
					color="#f00"
					unitValue={-4}
					countUnits
					label="Calamités"
					onChange={onChange}
				/>,
			);
			expect(screen.getByLabelText("Calamités")).toHaveDisplayValue("2");
			expect(screen.getByText("2 × -4 = -8 pts")).toBeOnTheScreen();
			await tapStepper("Augmenter Calamités");
			expect(onChange).toHaveBeenLastCalledWith(-12);
		});

		it("en mode comptage, ne descend pas sous zéro unité", async () => {
			const onChange = jest.fn();
			await render(
				<ManualPointsFields
					points={0}
					color="#f00"
					unitValue={-4}
					countUnits
					onChange={onChange}
				/>,
			);
			await tapStepper("Diminuer");
			expect(onChange).toHaveBeenLastCalledWith(0);
		});

		it("signale un score ajusté hors multiple de l'unité", async () => {
			await render(
				<ManualPointsFields
					points={-5}
					color="#f00"
					unitValue={-4}
					countUnits
					onChange={jest.fn()}
				/>,
			);
			expect(screen.getByText("Ajusté en points : -5 pts")).toBeOnTheScreen();
		});
	});

	it("respecte le plafond de la catégorie", async () => {
		const onChange = jest.fn();
		await render(<ManualPointsFields points={10} color="#f00" max={10} onChange={onChange} />);
		await tapStepper("Augmenter");
		expect(onChange).toHaveBeenLastCalledWith(10);
	});
});
