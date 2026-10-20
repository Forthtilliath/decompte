import { Text, View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { RadioGroup } from "@/components/ui/RadioGroup";
import type { DraftCategory } from "@/lib/gameDraft";
import type { ScoringBrick } from "@/types/game";

type ProductBrick = Extract<ScoringBrick, { kind: "product" }>;

type Props = {
	brick: ProductBrick;
	/** Catégories placées au-dessus : les seules qu'un multiplicateur peut multiplier. */
	sources: DraftCategory[];
	onChange: (brick: ProductBrick) => void;
};

/** Catégorie « Multiplicateur » : un nombre saisi × les points d'une catégorie placée avant. */
export function ProductBrickEditor({ brick, sources, onChange }: Props) {
	const { styles } = useBrickEditorStyles();
	const choices = sources.filter((c) => c.id && c.label.trim());

	if (choices.length === 0) {
		return (
			<Text style={styles.hint}>
				Ajoute d'abord, au-dessus de celle-ci, la catégorie dont les points seront multipliés.
			</Text>
		);
	}

	return (
		<View style={styles.fields}>
			<Text style={styles.switchLabel}>Multiplie les points de</Text>
			<RadioGroup
				options={choices.map((c) => ({ value: c.id as string, label: c.label.trim() }))}
				value={brick.sourceId || null}
				onChange={(sourceId) => onChange({ kind: "product", sourceId })}
			/>
			<Text style={styles.hint}>
				Pendant la partie, on saisit un nombre (ex. de sets) : il est multiplié par les points du
				joueur dans cette catégorie, pour la même manche.
			</Text>
		</View>
	);
}
