import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BooleanBrickEditor } from "@/components/games/bricks/BooleanBrickEditor";
import { ChoiceBrickEditor } from "@/components/games/bricks/ChoiceBrickEditor";
import { ManualBrickEditor } from "@/components/games/bricks/ManualBrickEditor";
import { TokenBrickEditor } from "@/components/games/bricks/TokenBrickEditor";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { type DraftCategory, emptyBrick } from "@/lib/gameDraft";
import type { ScoringBrick } from "@/types/game";

type Props = {
	category: DraftCategory;
	onChange: (patch: Partial<DraftCategory>) => void;
	onRemove: () => void;
};

const BRICK_OPTIONS: { value: ScoringBrick["kind"]; label: string }[] = [
	{ value: "manual", label: "Nombre" },
	{ value: "tokens", label: "Jetons" },
	{ value: "choice", label: "Choix" },
	{ value: "boolean", label: "Oui / Non" },
];

/** Une catégorie du formulaire de jeu : nom, type de calcul et réglages propres à ce type. */
export function CategoryEditor({ category, onChange, onRemove }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { brick } = category;
	const setBrick = (next: ScoringBrick) => onChange({ brick: next });

	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<View style={styles.labelField}>
					<TextField
						placeholder="Nom de la catégorie"
						value={category.label}
						onChangeText={(label) => onChange({ label })}
					/>
				</View>
				<Pressable
					onPress={onRemove}
					hitSlop={12}
					accessibilityRole="button"
					accessibilityLabel="Supprimer la catégorie"
				>
					<Ionicons name="trash-outline" size={20} color={colors.danger} />
				</Pressable>
			</View>

			<RadioGroup
				options={BRICK_OPTIONS}
				value={brick.kind}
				onChange={(kind) => setBrick(emptyBrick(kind))}
			/>

			{brick.kind === "manual" && <ManualBrickEditor brick={brick} onChange={setBrick} />}
			{brick.kind === "tokens" && <TokenBrickEditor brick={brick} onChange={setBrick} />}
			{brick.kind === "choice" && <ChoiceBrickEditor brick={brick} onChange={setBrick} />}
			{brick.kind === "boolean" && <BooleanBrickEditor brick={brick} onChange={setBrick} />}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					gap: SPACING.sm,
				},
				header: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				labelField: {
					flex: 1,
				},
			}),
		[colors],
	);
}
