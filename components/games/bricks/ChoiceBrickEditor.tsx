import { View } from "react-native";
import { BrickItemRow } from "@/components/games/bricks/BrickItemRow";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { Button } from "@/components/ui/Button";
import { createId } from "@/lib/uuid";
import type { ChoiceOption, ScoringBrick } from "@/types/game";

type ChoiceBrick = Extract<ScoringBrick, { kind: "choice" }>;

type Props = {
	brick: ChoiceBrick;
	onChange: (brick: ChoiceBrick) => void;
};

/** Catégorie « Choix » : valeurs sélectionnables, chacune à score fixe. */
export function ChoiceBrickEditor({ brick, onChange }: Props) {
	const { styles } = useBrickEditorStyles();
	const updateOption = (id: string, patch: Partial<ChoiceOption>) =>
		onChange({
			...brick,
			options: brick.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
		});

	return (
		<View style={styles.fields}>
			{brick.options.map((option, index) => (
				<BrickItemRow
					key={option.id}
					title={`Valeur ${index + 1}`}
					label={option.label}
					labelPlaceholder="Ex. Palier 3"
					value={option.value}
					valueLabel="Score"
					removeLabel="Supprimer cette valeur"
					onChangeLabel={(label) => updateOption(option.id, { label })}
					onChangeValue={(value) => updateOption(option.id, { value })}
					onRemove={() =>
						onChange({ ...brick, options: brick.options.filter((o) => o.id !== option.id) })
					}
				/>
			))}
			<Button
				label="Ajouter une valeur"
				variant="ghost"
				onPress={() =>
					onChange({
						...brick,
						options: [...brick.options, { id: createId(), label: "", value: 0 }],
					})
				}
			/>
		</View>
	);
}
