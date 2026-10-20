import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { CategoryEditor } from "@/components/games/CategoryEditor";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import {
	type DraftCategory,
	emptyCategory,
	type GameDraftValues,
	nextCategoryColor,
	validateGameDraft,
} from "@/lib/gameDraft";
import { paletteColor } from "@/lib/gameExport";
import type { CategoryDef } from "@/types/game";

export type GameBuilderValues = {
	name: string;
	categories: CategoryDef[];
	minPlayers: number;
	maxPlayers: number;
	rounds?: number;
};

type Props = {
	initial?: GameBuilderValues;
	submitLabel: string;
	onSubmit: (values: GameDraftValues) => void;
};

/** Formulaire de création/édition d'un jeu : nom, bornes de joueurs, liste de catégories de score.
 * Partagé entre `jeux/new.tsx` et `jeux/[id]/edit.tsx`. */
export function GameBuilderForm({ initial, submitLabel, onSubmit }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const [name, setName] = useState(initial?.name ?? "");
	const [minPlayers, setMinPlayers] = useState(String(initial?.minPlayers ?? 1));
	const [maxPlayers, setMaxPlayers] = useState(String(initial?.maxPlayers ?? 8));
	const [rounds, setRounds] = useState(String(initial?.rounds ?? 1));
	const [categories, setCategories] = useState<DraftCategory[]>(
		initial?.categories.map((c) => ({
			id: c.id,
			label: c.label,
			brick: c.brick,
			color: c.color,
			requiresValidation: c.requiresValidation,
		})) ?? [{ ...emptyCategory(), color: nextCategoryColor([]) }],
	);

	const updateCategory = (index: number, patch: Partial<DraftCategory>) => {
		setCategories((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
	};

	const addCategory = () => {
		setCategories((current) => [
			...current,
			{ ...emptyCategory(), color: nextCategoryColor(current) },
		]);
	};

	const removeCategory = (index: number) => {
		setCategories((current) => current.filter((_, i) => i !== index));
	};

	const handleSubmit = () => {
		const result = validateGameDraft({ name, minPlayers, maxPlayers, rounds, categories });
		if (!result.ok) {
			Alert.alert(result.title, result.message);
			return;
		}
		onSubmit(result.values);
	};

	return (
		<ScrollView contentContainerStyle={styles.content}>
			<TextField label="Nom du jeu" value={name} onChangeText={setName} placeholder="Ex. Azul" />

			<View style={styles.playersRow}>
				<View style={styles.playersField}>
					<TextField
						label="Joueurs min."
						value={minPlayers}
						onChangeText={setMinPlayers}
						keyboardType="number-pad"
					/>
				</View>
				<View style={styles.playersField}>
					<TextField
						label="Joueurs max."
						value={maxPlayers}
						onChangeText={setMaxPlayers}
						keyboardType="number-pad"
					/>
				</View>
				<View style={styles.playersField}>
					<TextField
						label="Manches"
						value={rounds}
						onChangeText={setRounds}
						keyboardType="number-pad"
					/>
				</View>
			</View>
			{Number.parseInt(rounds, 10) > 1 && (
				<Text style={styles.hint}>
					Toutes les catégories se saisissent à chaque manche, puis les manches s'additionnent.
				</Text>
			)}

			<Text style={styles.sectionTitle}>Catégories de score</Text>
			{categories.map((category, index) => (
				<CategoryEditor
					// biome-ignore lint/suspicious/noArrayIndexKey: liste réordonnée seulement par ajout/suppression en bout, pas de tri
					key={index}
					category={category}
					color={category.color ?? paletteColor(index)}
					onChange={(patch) => updateCategory(index, patch)}
					onRemove={() => removeCategory(index)}
				/>
			))}
			<Button label="Ajouter une catégorie" variant="ghost" onPress={addCategory} />

			<Button label={submitLabel} onPress={handleSubmit} style={styles.submit} />
		</ScrollView>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.md,
					paddingBottom: SPACING.lg,
				},
				playersRow: {
					flexDirection: "row",
					gap: SPACING.sm,
				},
				playersField: {
					flex: 1,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
				sectionTitle: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
					marginTop: SPACING.sm,
				},
				submit: {
					marginTop: SPACING.sm,
				},
			}),
		[colors],
	);
}
