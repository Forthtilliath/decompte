import { fireEvent, render, screen } from "@testing-library/react-native";
import { BooleanScoreField } from "@/components/scoring/BooleanScoreField";
import { CategoryScoreField } from "@/components/scoring/CategoryScoreField";
import { ChoiceScoreField } from "@/components/scoring/ChoiceScoreField";
import { makeCategory } from "@/test/factories";

const OPTIONS = [
	{ id: "bas", label: "Bas", value: 0 },
	{ id: "haut", label: "Haut", value: 5 },
	{ id: "malus", label: "Malus", value: -2 },
];

const radio = (name: string) => screen.getByRole("radio", { name });

describe("ChoiceScoreField", () => {
	it("affiche chaque valeur avec son score signé", async () => {
		await render(<ChoiceScoreField points={undefined} options={OPTIONS} onChange={jest.fn()} />);
		expect(radio("Bas (+0)")).toBeOnTheScreen();
		expect(radio("Haut (+5)")).toBeOnTheScreen();
		expect(radio("Malus (-2)")).toBeOnTheScreen();
	});

	it("ne coche rien tant que rien n'est saisi, même l'option qui vaut 0", async () => {
		await render(<ChoiceScoreField points={undefined} options={OPTIONS} onChange={jest.fn()} />);
		for (const name of ["Bas (+0)", "Haut (+5)", "Malus (-2)"]) {
			expect(radio(name)).not.toBeSelected();
		}
	});

	it("coche l'option correspondant au score enregistré", async () => {
		await render(<ChoiceScoreField points={5} options={OPTIONS} onChange={jest.fn()} />);
		expect(radio("Haut (+5)")).toBeSelected();
		expect(radio("Bas (+0)")).not.toBeSelected();
	});

	it("enregistre le score de l'option choisie", async () => {
		const onChange = jest.fn();
		await render(<ChoiceScoreField points={undefined} options={OPTIONS} onChange={onChange} />);
		await fireEvent.press(radio("Malus (-2)"));
		expect(onChange).toHaveBeenCalledWith(-2);
	});
});

describe("BooleanScoreField", () => {
	it("ne coche rien tant que rien n'est saisi", async () => {
		await render(
			<BooleanScoreField points={undefined} yesValue={3} noValue={0} onChange={jest.fn()} />,
		);
		expect(radio("Oui (+3)")).not.toBeSelected();
		expect(radio("Non (+0)")).not.toBeSelected();
	});

	it("coche la réponse correspondant au score enregistré", async () => {
		await render(<BooleanScoreField points={0} yesValue={3} noValue={0} onChange={jest.fn()} />);
		expect(radio("Non (+0)")).toBeSelected();
	});

	it("enregistre le score de la réponse choisie", async () => {
		const onChange = jest.fn();
		await render(
			<BooleanScoreField points={undefined} yesValue={3} noValue={-1} onChange={onChange} />,
		);
		await fireEvent.press(radio("Oui (+3)"));
		expect(onChange).toHaveBeenLastCalledWith(3);
		await fireEvent.press(radio("Non (-1)"));
		expect(onChange).toHaveBeenLastCalledWith(-1);
	});
});

describe("CategoryScoreField", () => {
	it("affiche un stepper pour une catégorie « Nombre », à 0 tant que rien n'est saisi", async () => {
		await render(
			<CategoryScoreField category={makeCategory()} points={undefined} onChange={jest.fn()} />,
		);
		expect(screen.getByRole("button", { name: "Augmenter Points" })).toBeOnTheScreen();
		expect(screen.getByDisplayValue("0")).toBeOnTheScreen();
	});

	it("affiche le stepper et la calculette pour une catégorie « Jetons »", async () => {
		const category = makeCategory({
			brick: { kind: "tokens", tokens: [{ label: "+1", value: 1 }] },
		});
		await render(<CategoryScoreField category={category} points={4} onChange={jest.fn()} />);
		expect(screen.getByDisplayValue("4")).toBeOnTheScreen();
		expect(screen.getByText("Compter par jetons")).toBeOnTheScreen();
	});

	it("affiche les options d'une catégorie « Choix »", async () => {
		const category = makeCategory({ brick: { kind: "choice", options: OPTIONS } });
		await render(
			<CategoryScoreField category={category} points={undefined} onChange={jest.fn()} />,
		);
		expect(screen.getAllByRole("radio")).toHaveLength(3);
	});

	it("affiche Oui / Non pour une catégorie « Oui / Non »", async () => {
		const category = makeCategory({ brick: { kind: "boolean", yesValue: 2, noValue: 0 } });
		await render(<CategoryScoreField category={category} points={2} onChange={jest.fn()} />);
		expect(radio("Oui (+2)")).toBeSelected();
	});
});
