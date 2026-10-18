import { View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { TextField } from "@/components/ui/TextField";
import { parseNumberOrZero } from "@/lib/numbers";
import type { ScoringBrick } from "@/types/game";

type BooleanBrick = Extract<ScoringBrick, { kind: "boolean" }>;

type Props = {
	brick: BooleanBrick;
	onChange: (brick: BooleanBrick) => void;
};

/** Catégorie « Oui / Non » : le score rapporté par chaque réponse. */
export function BooleanBrickEditor({ brick, onChange }: Props) {
	const { styles } = useBrickEditorStyles();

	return (
		<View style={styles.fields}>
			<View style={styles.itemFields}>
				<View style={styles.itemLabel}>
					<TextField
						label="Score si Oui"
						keyboardType="numeric"
						value={String(brick.yesValue)}
						onChangeText={(raw) => onChange({ ...brick, yesValue: parseNumberOrZero(raw) })}
					/>
				</View>
				<View style={styles.itemLabel}>
					<TextField
						label="Score si Non"
						keyboardType="numeric"
						value={String(brick.noValue)}
						onChangeText={(raw) => onChange({ ...brick, noValue: parseNumberOrZero(raw) })}
					/>
				</View>
			</View>
		</View>
	);
}
