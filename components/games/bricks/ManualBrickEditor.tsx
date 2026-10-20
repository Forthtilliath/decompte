import { Pressable, Switch, Text, View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { IntegerField } from "@/components/ui/IntegerField";
import { TextField } from "@/components/ui/TextField";
import { parseNumberOrZero } from "@/lib/numbers";
import type { ScoringBrick } from "@/types/game";

type ManualBrick = Extract<ScoringBrick, { kind: "manual" }>;

const DEFAULT_MAX = 100;
const DEFAULT_UNIT_VALUE = 2;

type Props = {
	brick: ManualBrick;
	onChange: (brick: ManualBrick) => void;
};

/** Catégorie « Nombre » : négatif autorisé ou non, plafond et valeur par unité optionnels. */
export function ManualBrickEditor({ brick, onChange }: Props) {
	const { colors, styles } = useBrickEditorStyles();
	const setAllowNegative = (allowNegative: boolean) => onChange({ ...brick, allowNegative });
	const setCapped = (capped: boolean) =>
		onChange({ ...brick, max: capped ? DEFAULT_MAX : undefined });
	const setCountsUnits = (countsUnits: boolean) =>
		onChange({ ...brick, unitValue: countsUnits ? DEFAULT_UNIT_VALUE : undefined });

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

			<Pressable
				style={styles.switchRow}
				onPress={() => setCountsUnits(brick.unitValue === undefined)}
			>
				<Switch
					value={brick.unitValue !== undefined}
					onValueChange={setCountsUnits}
					trackColor={{ false: colors.border, true: colors.primary }}
					accessibilityLabel="Compter par unités"
				/>
				<Text style={styles.switchLabel}>Compter par unités</Text>
			</Pressable>

			{brick.unitValue !== undefined && (
				<>
					<IntegerField
						label="Points par unité"
						placeholder="Ex. -4"
						value={brick.unitValue}
						onChange={(unitValue) => onChange({ ...brick, unitValue })}
					/>
					<Text style={styles.hint}>
						Pendant la partie, les boutons − et + avancent de cette valeur (ex. 0, -4, -8…).
					</Text>
				</>
			)}
		</View>
	);
}
