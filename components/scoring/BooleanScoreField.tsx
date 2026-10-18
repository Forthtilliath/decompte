import { RadioGroup } from "@/components/ui/RadioGroup";

type Props = {
	points: number | undefined;
	yesValue: number;
	noValue: number;
	onChange: (value: number) => void;
};

/** Catégorie "Oui / Non" : condition remplie ou non, chaque réponse rapportant son propre score. */
export function BooleanScoreField({ points, yesValue, noValue, onChange }: Props) {
	const selected = points === yesValue ? "yes" : points === noValue ? "no" : null;

	return (
		<RadioGroup
			options={[
				{ value: "yes", label: `Oui (${yesValue >= 0 ? "+" : ""}${yesValue})` },
				{ value: "no", label: `Non (${noValue >= 0 ? "+" : ""}${noValue})` },
			]}
			value={selected}
			onChange={(v) => onChange(v === "yes" ? yesValue : noValue)}
		/>
	);
}
