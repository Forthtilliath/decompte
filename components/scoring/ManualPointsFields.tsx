import { StyleSheet, View } from "react-native";
import { NumberStepper } from "@/components/ui/NumberStepper";

type Props = {
	points: number;
	onChange: (points: number) => void;
	color: string;
	allowNegative?: boolean;
	max?: number;
	/** Points d'une unité (ex. −4 par calamité) : les boutons avancent alors de ce pas. */
	unitValue?: number;
	/** Ce qui est compté (ex. "Calamités"), pour les libellés d'accessibilité. */
	label?: string;
};

export function ManualPointsFields({
	points,
	onChange,
	color,
	allowNegative = false,
	max,
	unitValue,
	label,
}: Props) {
	// Une unité négative (malus) n'a de sens que si le score peut descendre sous zéro.
	const negative = allowNegative || (unitValue !== undefined && unitValue < 0);
	return (
		<View style={styles.row}>
			<NumberStepper
				value={points}
				onChange={onChange}
				min={negative ? undefined : 0}
				max={max}
				step={unitValue === undefined ? 1 : Math.abs(unitValue)}
				accentColor={color}
				label={label}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		justifyContent: "center",
	},
});
