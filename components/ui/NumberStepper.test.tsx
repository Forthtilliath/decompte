import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { NumberStepper } from "@/components/ui/NumberStepper";

jest.mock("@forthtilliath/react-native-kit/utils/helpers/haptics");

type StepperProps = Omit<React.ComponentProps<typeof NumberStepper>, "value" | "onChange">;

/** Stepper contrôlé comme dans l'app : la valeur affichée suit chaque onChange. */
function Controlled({
	initial = 0,
	onChange,
	...props
}: StepperProps & { initial?: number; onChange?: (n: number) => void }) {
	const [value, setValue] = useState(initial);
	return (
		<NumberStepper
			{...props}
			value={value}
			onChange={(n) => {
				setValue(n);
				onChange?.(n);
			}}
		/>
	);
}

const input = () => screen.getByLabelText("Points");
const press = async (name: string) => {
	const button = screen.getByRole("button", { name });
	await fireEvent(button, "pressIn");
	await fireEvent(button, "pressOut");
};

describe("NumberStepper", () => {
	beforeEach(() => jest.clearAllMocks());

	it("augmente et diminue d'un pas", async () => {
		await render(<Controlled label="Points" initial={3} />);
		await press("Augmenter Points");
		expect(input()).toHaveDisplayValue("4");
		await press("Diminuer Points");
		await press("Diminuer Points");
		expect(input()).toHaveDisplayValue("2");
	});

	it("respecte le pas configuré", async () => {
		await render(<Controlled label="Points" step={5} />);
		await press("Augmenter Points");
		expect(input()).toHaveDisplayValue("5");
	});

	it("bloque à 0 par défaut et ne vibre pas quand la valeur ne bouge pas", async () => {
		await render(<Controlled label="Points" min={0} />);
		await press("Diminuer Points");
		expect(input()).toHaveDisplayValue("0");
		expect(tapFeedback).not.toHaveBeenCalled();
	});

	it("descend sous zéro quand aucun minimum n'est imposé", async () => {
		await render(<Controlled label="Points" min={undefined} />);
		await press("Diminuer Points");
		expect(input()).toHaveDisplayValue("-1");
	});

	it("bloque au maximum", async () => {
		await render(<Controlled label="Points" initial={9} max={10} />);
		await press("Augmenter Points");
		await press("Augmenter Points");
		expect(input()).toHaveDisplayValue("10");
		expect(tapFeedback).toHaveBeenCalledTimes(1);
	});

	it("accepte une saisie clavier, bornée", async () => {
		const onChange = jest.fn();
		await render(<Controlled label="Points" min={0} max={50} onChange={onChange} />);
		await fireEvent.changeText(input(), "42");
		expect(onChange).toHaveBeenLastCalledWith(42);
		await fireEvent.changeText(input(), "120");
		expect(onChange).toHaveBeenLastCalledWith(50);
	});

	it("filtre les caractères invalides et laisse taper un négatif en plusieurs frappes", async () => {
		const onChange = jest.fn();
		await render(<Controlled label="Points" min={undefined} onChange={onChange} />);

		await fireEvent.changeText(input(), "-");
		expect(input()).toHaveDisplayValue("-");
		expect(onChange).not.toHaveBeenCalled();

		await fireEvent.changeText(input(), "-1a3");
		expect(onChange).toHaveBeenLastCalledWith(-13);
	});

	it("refuse le signe moins quand le négatif est interdit", async () => {
		const onChange = jest.fn();
		await render(<Controlled label="Points" min={0} onChange={onChange} />);
		await fireEvent.changeText(input(), "-7");
		expect(onChange).toHaveBeenLastCalledWith(7);
	});

	it("réaffiche la dernière valeur valide en quittant un champ vidé", async () => {
		await render(<Controlled label="Points" initial={8} />);
		await fireEvent.changeText(input(), "");
		expect(input()).toHaveDisplayValue("");
		await fireEvent(input(), "blur");
		expect(input()).toHaveDisplayValue("8");
	});

	describe("appui long", () => {
		beforeEach(() => jest.useFakeTimers());
		afterEach(() => jest.useRealTimers());

		it("répète puis accélère, et s'arrête au relâchement", async () => {
			await render(<Controlled label="Points" />);
			const plus = screen.getByRole("button", { name: "Augmenter Points" });

			await fireEvent(plus, "pressIn");
			expect(input()).toHaveDisplayValue("1");

			// 450 ms d'attente, puis un pas toutes les 180 ms.
			await act(() => jest.advanceTimersByTime(450 + 180 * 3));
			expect(input()).toHaveDisplayValue("4");

			// Après 1,2 s de répétition : un pas toutes les 60 ms.
			await act(() => jest.advanceTimersByTime(1200 - 180 * 3 + 60 * 10));
			const accelerated = Number(input().props.value);
			expect(accelerated).toBeGreaterThanOrEqual(14);

			await fireEvent(plus, "pressOut");
			await act(() => jest.advanceTimersByTime(5000));
			expect(input()).toHaveDisplayValue(String(accelerated));
		});

		it("s'arrête net au minimum pendant la répétition", async () => {
			await render(<Controlled label="Points" initial={2} min={0} />);
			const minus = screen.getByRole("button", { name: "Diminuer Points" });
			await fireEvent(minus, "pressIn");
			await act(() => jest.advanceTimersByTime(3000));
			expect(input()).toHaveDisplayValue("0");
			await fireEvent(minus, "pressOut");
		});

		it("arrête la répétition si l'écran se ferme pendant l'appui", async () => {
			const onChange = jest.fn();
			const { unmount } = await render(<Controlled label="Points" onChange={onChange} />);
			await fireEvent(screen.getByRole("button", { name: "Augmenter Points" }), "pressIn");
			await unmount();
			onChange.mockClear();
			await act(() => jest.advanceTimersByTime(5000));
			expect(onChange).not.toHaveBeenCalled();
		});
	});
});
