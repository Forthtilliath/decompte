import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { BooleanBrickEditor } from "@/components/games/bricks/BooleanBrickEditor";
import { ChoiceBrickEditor } from "@/components/games/bricks/ChoiceBrickEditor";
import { ManualBrickEditor } from "@/components/games/bricks/ManualBrickEditor";
import { TokenBrickEditor } from "@/components/games/bricks/TokenBrickEditor";
import { CategoryColorSheet, categoryColorName } from "@/components/games/CategoryColorSheet";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { type DraftCategory, emptyBrick } from "@/lib/gameDraft";
import type { ScoringBrick } from "@/types/game";

type Props = {
	category: DraftCategory;
	/** Couleur affichée : celle choisie, sinon celle que la position donnera à l'enregistrement. */
	color: string;
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
export function CategoryEditor({ category, color, onChange, onRemove }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const [colorSheetOpen, setColorSheetOpen] = useState(false);
	const { brick } = category;
	const setBrick = (next: ScoringBrick) => onChange({ brick: next });
	const requiresValidation = category.requiresValidation ?? false;
	const setRequiresValidation = (next: boolean) => onChange({ requiresValidation: next });

	return (
		<View style={styles.card}>
			<View style={styles.header}>
				<Pressable
					style={[styles.colorDot, { backgroundColor: color }]}
					onPress={() => setColorSheetOpen(true)}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel={`Couleur de la catégorie, ${categoryColorName(color)}`}
				/>
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

			<Pressable
				style={styles.switchRow}
				onPress={() => setRequiresValidation(!requiresValidation)}
			>
				<Switch
					value={requiresValidation}
					onValueChange={setRequiresValidation}
					trackColor={{ false: colors.border, true: colors.primary }}
					accessibilityLabel="Critère à valider"
				/>
				<Text style={styles.switchLabel}>Critère à valider</Text>
			</Pressable>
			{requiresValidation && (
				<Text style={styles.hint}>
					Pendant la partie, chaque joueur a une case à cocher : ses points ne comptent que si le
					critère est validé.
				</Text>
			)}

			<CategoryColorSheet
				visible={colorSheetOpen}
				value={color}
				onChange={(next) => onChange({ color: next })}
				onClose={() => setColorSheetOpen(false)}
			/>
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
				colorDot: {
					width: 32,
					height: 32,
					borderRadius: RADIUS.full,
				},
				labelField: {
					flex: 1,
				},
				switchRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
					marginTop: SPACING.xs,
				},
				switchLabel: {
					flex: 1,
					color: colors.text,
					fontSize: 14,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 12,
				},
			}),
		[colors],
	);
}
