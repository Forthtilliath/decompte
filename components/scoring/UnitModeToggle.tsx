import { RadioGroup } from "@/components/ui/RadioGroup";
import { formatUnitValue } from "@/lib/units";

export type UnitMode = "units" | "points";

type Props = {
	unitValue: number;
	value: UnitMode;
	onChange: (mode: UnitMode) => void;
};

/**
 * Choix de saisie d'une catégorie à valeur par unité, commun à tous les joueurs de l'étape :
 * compter les unités (3 → 3 × −4) ou ajuster les points par pas de la valeur (0, −4, −8…).
 */
export function UnitModeToggle({ unitValue, value, onChange }: Props) {
	return (
		<RadioGroup
			options={[
				{ value: "units", label: `Compter (× ${formatUnitValue(unitValue)})` },
				{ value: "points", label: `Points (± ${Math.abs(unitValue)})` },
			]}
			value={value}
			onChange={onChange}
		/>
	);
}
