import { View } from "react-native";
import { BrickItemRow } from "@/components/games/bricks/BrickItemRow";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { Button } from "@/components/ui/Button";
import type { TokenDenomination } from "@/lib/tokens";
import type { ScoringBrick } from "@/types/game";

type TokensBrick = Extract<ScoringBrick, { kind: "tokens" }>;

type Props = {
	brick: TokensBrick;
	onChange: (brick: TokensBrick) => void;
};

/** Catégorie « Jetons » : liste des jetons et de leur valeur en points. */
export function TokenBrickEditor({ brick, onChange }: Props) {
	const { styles } = useBrickEditorStyles();
	const updateToken = (index: number, patch: Partial<TokenDenomination>) =>
		onChange({
			...brick,
			tokens: brick.tokens.map((t, i) => (i === index ? { ...t, ...patch } : t)),
		});

	return (
		<View style={styles.fields}>
			{brick.tokens.map((token, index) => (
				<BrickItemRow
					// biome-ignore lint/suspicious/noArrayIndexKey: liste réordonnée seulement par ajout/suppression en bout, pas de tri
					key={index}
					title={`Jeton ${index + 1}`}
					label={token.label}
					labelPlaceholder="Ex. Victoire +3"
					value={token.value}
					valueLabel="Valeur"
					removeLabel="Supprimer ce jeton"
					onChangeLabel={(label) => updateToken(index, { label })}
					onChangeValue={(value) => updateToken(index, { value })}
					onRemove={() =>
						onChange({ ...brick, tokens: brick.tokens.filter((_, i) => i !== index) })
					}
				/>
			))}
			<Button
				label="Ajouter un jeton"
				variant="ghost"
				onPress={() => onChange({ ...brick, tokens: [...brick.tokens, { label: "", value: 1 }] })}
			/>
		</View>
	);
}
