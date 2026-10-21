import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { type KeyboardChain, NumberStepper } from "@/components/ui/NumberStepper";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { MAX_FACTOR } from "@/lib/gameLimits";

type Props = {
	/** Nombre saisi, `undefined` tant que rien ne l'est. */
	factor: number | undefined;
	/** Points du joueur dans la catégorie multipliée, pour la même manche. */
	sourcePoints: number;
	sourceLabel: string;
	/** Points obtenus (nombre × points multipliés). */
	points: number | undefined;
	color: string;
	label: string;
	onChange: (factor: number) => void;
	chain?: KeyboardChain;
};

/** Catégorie « Multiplicateur » : un nombre à saisir, multiplié par une autre catégorie. */
export function ProductScoreField({
	factor,
	sourcePoints,
	sourceLabel,
	points,
	color,
	label,
	onChange,
	chain,
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<View style={styles.container}>
			<NumberStepper
				value={factor ?? 0}
				onChange={onChange}
				min={0}
				max={MAX_FACTOR}
				accentColor={color}
				label={label}
				chain={chain}
			/>
			<Text style={styles.detail}>
				× {sourcePoints} ({sourceLabel}) = {points ?? 0} points
			</Text>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.xs,
				},
				detail: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
