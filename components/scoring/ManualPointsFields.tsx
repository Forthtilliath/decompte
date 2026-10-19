import { StyleSheet, Text, View } from "react-native";
import { NumberStepper } from "@/components/ui/NumberStepper";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatUnitValue, maxUnits, pointsToUnits, unitsToPoints } from "@/lib/units";

type Props = {
	points: number;
	onChange: (points: number) => void;
	color: string;
	allowNegative?: boolean;
	max?: number;
	/** Points d'une unité (ex. −4 par calamité) : les boutons avancent alors de ce pas. */
	unitValue?: number;
	/** Avec `unitValue` : on saisit le nombre d'unités, converti en points. */
	countUnits?: boolean;
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
	countUnits = false,
	label,
}: Props) {
	const colors = useColors();

	if (unitValue !== undefined && countUnits) {
		const units = pointsToUnits(points, unitValue);
		// Un score ajusté en mode points peut ne pas être un multiple de l'unité.
		const isMultiple = unitsToPoints(units, unitValue) === points;
		return (
			<View style={styles.column}>
				<NumberStepper
					value={units}
					onChange={(n) => onChange(unitsToPoints(n, unitValue))}
					min={0}
					max={maxUnits(unitValue, max)}
					accentColor={color}
					label={label}
				/>
				<Text style={[styles.detail, { color: colors.textMuted }]}>
					{isMultiple
						? `${units} × ${formatUnitValue(unitValue)} = ${points} pts`
						: `Ajusté en points : ${points} pts`}
				</Text>
			</View>
		);
	}

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
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		justifyContent: "center",
	},
	column: {
		alignItems: "center",
		gap: SPACING.xs,
	},
	detail: {
		fontSize: 13,
	},
});
