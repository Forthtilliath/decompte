import { fireEvent, render, screen } from "@testing-library/react-native";
import { CheckboxGroup } from "@/components/ui/CheckboxGroup";
import { RadioGroup } from "@/components/ui/RadioGroup";

const OPTIONS = [
	{ value: "a", label: "Option A" },
	{ value: "b", label: "Option B" },
];

describe("RadioGroup", () => {
	it("coche l'option courante et renvoie celle choisie", async () => {
		const onChange = jest.fn();
		await render(<RadioGroup options={OPTIONS} value="a" onChange={onChange} />);
		expect(screen.getByRole("radio", { name: "Option A" })).toBeSelected();
		expect(screen.getByRole("radio", { name: "Option B" })).not.toBeSelected();

		await fireEvent.press(screen.getByRole("radio", { name: "Option B" }));
		expect(onChange).toHaveBeenCalledWith("b");
	});

	it("ne coche rien sans valeur", async () => {
		await render(<RadioGroup options={OPTIONS} value={null} onChange={jest.fn()} />);
		expect(screen.getByRole("radio", { name: "Option A" })).not.toBeSelected();
	});
});

describe("CheckboxGroup", () => {
	it("ajoute une option décochée", async () => {
		const onChange = jest.fn();
		await render(<CheckboxGroup options={OPTIONS} values={["a"]} onChange={onChange} />);
		expect(screen.getByRole("checkbox", { name: "Option A" })).toBeChecked();
		await fireEvent.press(screen.getByRole("checkbox", { name: "Option B" }));
		expect(onChange).toHaveBeenCalledWith(["a", "b"]);
	});

	it("retire une option cochée", async () => {
		const onChange = jest.fn();
		await render(<CheckboxGroup options={OPTIONS} values={["a", "b"]} onChange={onChange} />);
		await fireEvent.press(screen.getByRole("checkbox", { name: "Option A" }));
		expect(onChange).toHaveBeenCalledWith(["b"]);
	});
});
