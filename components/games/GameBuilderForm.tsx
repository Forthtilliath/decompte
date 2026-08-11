import { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { CategoryEditor, type DraftCategory } from "@/components/games/CategoryEditor";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { CategoryDef } from "@/types/game";

export type GameBuilderValues = {
	name: string;
	categories: CategoryDef[];
	minPlayers: number;
	maxPlayers: number;
};

type Props = {
	initial?: GameBuilderValues;
	submitLabel: string;
	onSubmit: (values: {
		name: string;
		categories: DraftCategory[];
		minPlayers: number;
		maxPlayers: number;
	}) => void;
};

/** Formulaire de création/édition d'un jeu : nom, bornes de joueurs, liste de catégories de score.
 * Partagé entre `jeux/new.tsx` et `jeux/[id]/edit.tsx`. */
export function GameBuilderForm({ initial, submitLabel, onSubmit }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const [name, setName] = useState(initial?.name ?? "");
	const [minPlayers, setMinPlayers] = useState(String(initial?.minPlayers ?? 1));
	const [maxPlayers, setMaxPlayers] = useState(String(initial?.maxPlayers ?? 8));
	const [categories, setCategories] = useState<DraftCategory[]>(
		initial?.categories.map((c) => ({ id: c.id, label: c.label, brick: c.brick })) ?? [
			{ label: "", brick: { kind: "manual" } },
		],
	);

	const updateCategory = (index: number, patch: Partial<DraftCategory>) => {
		setCategories((current) => current.map((c, i) => (i === index ? { ...c, ...patch } : c)));
	};

	const addCategory = () => {
		setCategories((current) => [...current, { label: "", brick: { kind: "manual" } }]);
	};

	const removeCategory = (index: number) => {
		setCategories((current) => current.filter((_, i) => i !== index));
	};

	const handleSubmit = () => {
		if (!name.trim()) {
			Alert.alert("Nom manquant", "Donne un nom au jeu.");
			return;
		}
		if (categories.length === 0) {
			Alert.alert("Aucune catégorie", "Ajoute au moins une catégorie de score.");
			return;
		}
		if (categories.some((c) => !c.label.trim())) {
			Alert.alert("Catégorie incomplète", "Donne un nom à chaque catégorie.");
			return;
		}
		if (categories.some((c) => c.brick.kind === "tokens" && c.brick.tokens.length === 0)) {
			Alert.alert(
				"Jetons manquants",
				"Ajoute au moins un jeton aux catégories de type «Compteur de jetons».",
			);
			return;
		}
		const min = Number.parseInt(minPlayers, 10) || 1;
		const max = Number.parseInt(maxPlayers, 10) || min;
		onSubmit({ name, categories, minPlayers: min, maxPlayers: Math.max(min, max) });
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
			</View>

			<Text style={styles.sectionTitle}>Catégories de score</Text>
			{categories.map((category, index) => (
				<CategoryEditor
					// biome-ignore lint/suspicious/noArrayIndexKey: liste réordonnée seulement par ajout/suppression en bout, pas de tri
					key={index}
					category={category}
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
