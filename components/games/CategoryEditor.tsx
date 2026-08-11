import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import type { ScoringBrick } from "@/types/game";

export type DraftCategory = {
	id?: string;
	label: string;
	brick: ScoringBrick;
};

type Props = {
	category: DraftCategory;
	onChange: (patch: Partial<DraftCategory>) => void;
	onRemove: () => void;
};

const BRICK_OPTIONS = [
	{ value: "manual", label: "Nombre libre" },
	{ value: "tokens", label: "Compteur de jetons" },
] as const;

export function CategoryEditor({ category, onChange, onRemove }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	const setBrickKind = (kind: ScoringBrick["kind"]) => {
		onChange({
			brick: kind === "manual" ? { kind: "manual" } : { kind: "tokens", tokens: [] },
		});
	};

	const tokens = category.brick.kind === "tokens" ? category.brick.tokens : [];

	const updateToken = (index: number, patch: Partial<{ label: string; value: number }>) => {
		const next = tokens.map((t, i) => (i === index ? { ...t, ...patch } : t));
		onChange({ brick: { kind: "tokens", tokens: next } });
	};

	const addToken = () => {
		onChange({
			brick: { kind: "tokens", tokens: [...tokens, { label: "", value: 1 }] },
		});
	};

	const removeToken = (index: number) => {
		onChange({ brick: { kind: "tokens", tokens: tokens.filter((_, i) => i !== index) } });
	};

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
				options={BRICK_OPTIONS as unknown as { value: string; label: string }[]}
				value={category.brick.kind}
				onChange={(v) => setBrickKind(v as ScoringBrick["kind"])}
			/>

			{category.brick.kind === "tokens" && (
				<View style={styles.tokens}>
					{tokens.map((token, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: liste réordonnée seulement par ajout/suppression en bout, pas de tri
						<View key={index} style={styles.tokenRow}>
							<View style={styles.tokenLabel}>
								<TextField
									placeholder="Libellé (ex. Victoire +3)"
									value={token.label}
									onChangeText={(label) => updateToken(index, { label })}
								/>
							</View>
							<View style={styles.tokenValue}>
								<TextField
									placeholder="Valeur"
									keyboardType="numeric"
									value={String(token.value)}
									onChangeText={(raw) => updateToken(index, { value: Number(raw) || 0 })}
								/>
							</View>
							<Pressable
								onPress={() => removeToken(index)}
								hitSlop={12}
								accessibilityRole="button"
								accessibilityLabel="Supprimer ce jeton"
							>
								<Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
							</Pressable>
						</View>
					))}
					<Button label="Ajouter un jeton" variant="ghost" onPress={addToken} />
				</View>
			)}
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
				tokens: {
					gap: SPACING.sm,
					marginTop: SPACING.xs,
				},
				tokenRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				tokenLabel: {
					flex: 2,
				},
				tokenValue: {
					flex: 1,
				},
			}),
		[colors],
	);
}
