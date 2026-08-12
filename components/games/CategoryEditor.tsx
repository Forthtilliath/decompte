import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { RadioGroup } from "@/components/ui/RadioGroup";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { createId } from "@/lib/uuid";
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
	{ value: "manual", label: "Nombre" },
	{ value: "tokens", label: "Jetons" },
	{ value: "choice", label: "Choix" },
	{ value: "boolean", label: "Oui / Non" },
] as const;

function emptyBrick(kind: ScoringBrick["kind"]): ScoringBrick {
	switch (kind) {
		case "manual":
			return { kind: "manual", allowNegative: false };
		case "tokens":
			return { kind: "tokens", tokens: [] };
		case "choice":
			return { kind: "choice", options: [] };
		case "boolean":
			return { kind: "boolean", yesValue: 1, noValue: 0 };
	}
}

export function CategoryEditor({ category, onChange, onRemove }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const brick = category.brick;

	const setBrickKind = (kind: ScoringBrick["kind"]) => {
		onChange({ brick: emptyBrick(kind) });
	};

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
				options={BRICK_OPTIONS as unknown as { value: string; label: string }[]}
				value={brick.kind}
				onChange={(v) => setBrickKind(v as ScoringBrick["kind"])}
			/>

			{brick.kind === "manual" && (
				<View style={styles.fields}>
					<Pressable
						style={styles.switchRow}
						onPress={() => setBrick({ ...brick, allowNegative: !brick.allowNegative })}
					>
						<Switch
							value={brick.allowNegative}
							onValueChange={(allowNegative) => setBrick({ ...brick, allowNegative })}
							trackColor={{ false: colors.border, true: colors.primary }}
						/>
						<Text style={styles.switchLabel}>Autoriser les valeurs négatives</Text>
					</Pressable>

					<Pressable
						style={styles.switchRow}
						onPress={() => setBrick({ ...brick, max: brick.max === undefined ? 100 : undefined })}
					>
						<Switch
							value={brick.max !== undefined}
							onValueChange={(capped) => setBrick({ ...brick, max: capped ? 100 : undefined })}
							trackColor={{ false: colors.border, true: colors.primary }}
						/>
						<Text style={styles.switchLabel}>Plafonner</Text>
					</Pressable>

					{brick.max !== undefined && (
						<TextField
							label="Valeur maximum"
							placeholder="Ex. 100"
							keyboardType="number-pad"
							value={String(brick.max)}
							onChangeText={(raw) => setBrick({ ...brick, max: Number(raw) || 0 })}
						/>
					)}
				</View>
			)}

			{brick.kind === "tokens" && (
				<View style={styles.fields}>
					{brick.tokens.map((token, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: liste réordonnée seulement par ajout/suppression en bout, pas de tri
						<View key={index} style={styles.itemRow}>
							<View style={styles.itemLabel}>
								<TextField
									placeholder="Libellé (ex. Victoire +3)"
									value={token.label}
									onChangeText={(label) => {
										const tokens = brick.tokens.map((t, i) => (i === index ? { ...t, label } : t));
										setBrick({ ...brick, tokens });
									}}
								/>
							</View>
							<View style={styles.itemValue}>
								<TextField
									placeholder="Valeur"
									keyboardType="numeric"
									value={String(token.value)}
									onChangeText={(raw) => {
										const value = Number(raw) || 0;
										const tokens = brick.tokens.map((t, i) => (i === index ? { ...t, value } : t));
										setBrick({ ...brick, tokens });
									}}
								/>
							</View>
							<Pressable
								onPress={() =>
									setBrick({ ...brick, tokens: brick.tokens.filter((_, i) => i !== index) })
								}
								hitSlop={12}
								accessibilityRole="button"
								accessibilityLabel="Supprimer ce jeton"
							>
								<Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
							</Pressable>
						</View>
					))}
					<Button
						label="Ajouter un jeton"
						variant="ghost"
						onPress={() =>
							setBrick({ ...brick, tokens: [...brick.tokens, { label: "", value: 1 }] })
						}
					/>
				</View>
			)}

			{brick.kind === "choice" && (
				<View style={styles.fields}>
					{brick.options.map((option) => (
						<View key={option.id} style={styles.itemRow}>
							<View style={styles.itemLabel}>
								<TextField
									placeholder="Libellé (ex. Palier 3)"
									value={option.label}
									onChangeText={(label) => {
										const options = brick.options.map((o) =>
											o.id === option.id ? { ...o, label } : o,
										);
										setBrick({ ...brick, options });
									}}
								/>
							</View>
							<View style={styles.itemValue}>
								<TextField
									placeholder="Score"
									keyboardType="numeric"
									value={String(option.value)}
									onChangeText={(raw) => {
										const value = Number(raw) || 0;
										const options = brick.options.map((o) =>
											o.id === option.id ? { ...o, value } : o,
										);
										setBrick({ ...brick, options });
									}}
								/>
							</View>
							<Pressable
								onPress={() =>
									setBrick({ ...brick, options: brick.options.filter((o) => o.id !== option.id) })
								}
								hitSlop={12}
								accessibilityRole="button"
								accessibilityLabel="Supprimer cette valeur"
							>
								<Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
							</Pressable>
						</View>
					))}
					<Button
						label="Ajouter une valeur"
						variant="ghost"
						onPress={() =>
							setBrick({
								...brick,
								options: [...brick.options, { id: createId(), label: "", value: 0 }],
							})
						}
					/>
				</View>
			)}

			{brick.kind === "boolean" && (
				<View style={styles.fields}>
					<View style={styles.itemRow}>
						<View style={styles.itemLabel}>
							<TextField
								label="Score si Oui"
								keyboardType="numeric"
								value={String(brick.yesValue)}
								onChangeText={(raw) => setBrick({ ...brick, yesValue: Number(raw) || 0 })}
							/>
						</View>
						<View style={styles.itemLabel}>
							<TextField
								label="Score si Non"
								keyboardType="numeric"
								value={String(brick.noValue)}
								onChangeText={(raw) => setBrick({ ...brick, noValue: Number(raw) || 0 })}
							/>
						</View>
					</View>
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
				fields: {
					gap: SPACING.sm,
					marginTop: SPACING.xs,
				},
				switchRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				switchLabel: {
					flex: 1,
					color: colors.text,
					fontSize: 14,
				},
				itemRow: {
					flexDirection: "row",
					alignItems: "center",
					gap: SPACING.sm,
				},
				itemLabel: {
					flex: 2,
				},
				itemValue: {
					flex: 1,
				},
			}),
		[colors],
	);
}
