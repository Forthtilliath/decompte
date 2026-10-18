import { Pressable, Switch, Text, View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { TextField } from "@/components/ui/TextField";
import { parseNumberOrZero } from "@/lib/numbers";
import type { ScoringBrick } from "@/types/game";

type ManualBrick = Extract<ScoringBrick, { kind: "manual" }>;

const DEFAULT_MAX = 100;

type Props = {
	brick: ManualBrick;
	onChange: (brick: ManualBrick) => void;
};

/** Catégorie « Nombre » : négatif autorisé ou non, plafond optionnel. */
export function ManualBrickEditor({ brick, onChange }: Props) {
	const { colors, styles } = useBrickEditorStyles();
	const setAllowNegative = (allowNegative: boolean) => onChange({ ...brick, allowNegative });
	const setCapped = (capped: boolean) =>
		onChange({ ...brick, max: capped ? DEFAULT_MAX : undefined });

	return (
		<View style={styles.fields}>
			<Pressable style={styles.switchRow} onPress={() => setAllowNegative(!brick.allowNegative)}>
				<Switch
					value={brick.allowNegative}
					onValueChange={setAllowNegative}
					trackColor={{ false: colors.border, true: colors.primary }}
					accessibilityLabel="Autoriser les valeurs négatives"
				/>
				<Text style={styles.switchLabel}>Autoriser les valeurs négatives</Text>
			</Pressable>

			<Pressable style={styles.switchRow} onPress={() => setCapped(brick.max === undefined)}>
				<Switch
					value={brick.max !== undefined}
					onValueChange={setCapped}
					trackColor={{ false: colors.border, true: colors.primary }}
					accessibilityLabel="Plafonner"
				/>
				<Text style={styles.switchLabel}>Plafonner</Text>
			</Pressable>

			{brick.max !== undefined && (
				<TextField
					label="Valeur maximum"
					placeholder={`Ex. ${DEFAULT_MAX}`}
					keyboardType="number-pad"
					value={String(brick.max)}
					onChangeText={(raw) => onChange({ ...brick, max: parseNumberOrZero(raw) })}
				/>
			)}
		</View>
	);
}
