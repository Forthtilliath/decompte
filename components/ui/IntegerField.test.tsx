import { fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { IntegerField } from "@/components/ui/IntegerField";

function Controlled({ onChange, allowNegative }: { onChange: jest.Mock; allowNegative?: boolean }) {
	const [value, setValue] = useState(2);
	return (
		<IntegerField
			label="Valeur"
			value={value}
			allowNegative={allowNegative}
			onChange={(n) => {
				setValue(n);
				onChange(n);
			}}
		/>
	);
}

const field = () => screen.getByLabelText("Valeur");

describe("IntegerField", () => {
	// Régression : "-" seul était lu comme 0 et réaffiché "0", un négatif ne se tapait pas.
	it("laisse taper un négatif en plusieurs frappes", async () => {
		const onChange = jest.fn();
		await render(<Controlled onChange={onChange} />);
		await fireEvent.changeText(field(), "-");
		expect(field()).toHaveDisplayValue("-");
		expect(onChange).not.toHaveBeenCalled();
		await fireEvent.changeText(field(), "-4");
		expect(onChange).toHaveBeenLastCalledWith(-4);
		expect(field()).toHaveDisplayValue("-4");
	});

	it("réaffiche la dernière valeur valide en quittant un champ vidé", async () => {
		await render(<Controlled onChange={jest.fn()} />);
		await fireEvent.changeText(field(), "");
		expect(field()).toHaveDisplayValue("");
		await fireEvent(field(), "blur");
		expect(field()).toHaveDisplayValue("2");
	});

	it("ignore le signe moins quand le négatif est interdit", async () => {
		const onChange = jest.fn();
		await render(<Controlled onChange={onChange} allowNegative={false} />);
		await fireEvent.changeText(field(), "-7");
		expect(onChange).toHaveBeenLastCalledWith(7);
	});
});
