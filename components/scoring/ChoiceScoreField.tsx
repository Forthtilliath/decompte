import { RadioGroup } from "@/components/ui/RadioGroup";
import type { ChoiceOption } from "@/types/game";

type Props = {
	points: number;
	options: ChoiceOption[];
	onChange: (value: number) => void;
};

/** Catégorie "choix parmi des valeurs" : une seule option sélectionnable, chacune à score fixe. */
export function ChoiceScoreField({ points, options, onChange }: Props) {
	// La sélection courante se déduit du score déjà enregistré (le modèle ne garde que le nombre de
	// points, pas l'id de l'option choisie) : au premier chargement, rien ne correspond forcément.
	const selected = options.find((o) => o.value === points)?.id ?? null;

	return (
		<RadioGroup
			options={options.map((option) => ({
				value: option.id,
				label: `${option.label} (${option.value >= 0 ? "+" : ""}${option.value})`,
			}))}
			value={selected}
			onChange={(id) => {
				const option = options.find((o) => o.id === id);
				if (option) onChange(option.value);
			}}
		/>
	);
}
