import { Text, View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { TextField } from "@/components/ui/TextField";
import type { RoundMode, RoundsDraft } from "@/lib/gameDraftRounds";

type Props = {
	value: RoundsDraft;
	onChange: (patch: Partial<RoundsDraft>) => void;
};

const MODES: { value: RoundMode; label: string }[] = [
	{ value: "fixed", label: "Nombre fixe" },
	{ value: "scoreLimit", label: "Jusqu'à un seuil" },
	{ value: "free", label: "Libres" },
];

/** Manches d'un jeu : nombre fixe, jusqu'à un seuil de points (Odin, Skyjo…) ou libres. */
export function GameRoundsEditor({ value, onChange }: Props) {
	const { styles } = useBrickEditorStyles();

	return (
		<View style={styles.fields}>
			<RadioGroup
				options={MODES}
				value={value.roundMode}
				onChange={(roundMode) => onChange({ roundMode })}
			/>
			{value.roundMode === "fixed" && (
				<>
					<TextField
						label="Manches"
						value={value.rounds}
						onChangeText={(rounds) => onChange({ rounds })}
						keyboardType="number-pad"
					/>
					{Number.parseInt(value.rounds, 10) > 1 && (
						<Text style={styles.hint}>
							Toutes les catégories se saisissent à chaque manche, puis les manches s'additionnent.
						</Text>
					)}
				</>
			)}
			{value.roundMode === "scoreLimit" && (
				<>
					<TextField
						label="Seuil de fin de partie"
						value={value.scoreLimit}
						onChangeText={(scoreLimit) => onChange({ scoreLimit })}
						keyboardType="number-pad"
						placeholder="Ex. 15"
					/>
					<Text style={styles.hint}>
						Les manches s'enchaînent jusqu'à ce qu'un total atteigne ce seuil : la partie s'arrête à
						la fin de cette manche.
					</Text>
				</>
			)}
			{value.roundMode === "free" && (
				<Text style={styles.hint}>
					Les manches s'enchaînent : à la fin de chacune, on choisit d'en jouer une autre ou
					d'arrêter.
				</Text>
			)}
		</View>
	);
}
