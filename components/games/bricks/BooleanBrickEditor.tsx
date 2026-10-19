import { View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { IntegerField } from "@/components/ui/IntegerField";
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
					<IntegerField
						label="Score si Oui"
						value={brick.yesValue}
						onChange={(yesValue) => onChange({ ...brick, yesValue })}
					/>
				</View>
				<View style={styles.itemLabel}>
					<IntegerField
						label="Score si Non"
						value={brick.noValue}
						onChange={(noValue) => onChange({ ...brick, noValue })}
					/>
				</View>
			</View>
		</View>
	);
}
