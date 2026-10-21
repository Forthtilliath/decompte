import { useEffect, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { NumberStepper } from "@/components/ui/NumberStepper";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { readableTint } from "@/lib/contrast";
import { computeTokensTotal, type TokenDenomination } from "@/lib/tokens";

type Props = {
	visible: boolean;
	onClose: () => void;
	title: string;
	tokens: TokenDenomination[];
	accentColor: string;
	/** Remplace le total du champ direct par celui calculé ici. */
	onConfirm: (total: number) => void;
};

/**
 * Calculette de jetons : un compteur par valeur de jeton (ex. "Victoire (+3)" : 2), qui somme
 * automatiquement. Ne conserve pas le détail une fois validé — juste le total, comme la saisie
 * directe qu'elle remplace ; se réinitialise à zéro à chaque ouverture.
 */
export function TokenCounterSheet({
	visible,
	onClose,
	title,
	tokens,
	accentColor,
	onConfirm,
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const [counts, setCounts] = useState<number[]>(() => tokens.map(() => 0));

	useEffect(() => {
		if (visible) setCounts(tokens.map(() => 0));
	}, [visible, tokens]);

	const total = computeTokensTotal(tokens, counts);

	return (
		<BottomSheet visible={visible} onClose={onClose} title={title}>
			<ScrollView contentContainerStyle={styles.list}>
				{tokens.map((token, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: les jetons d'un jeu ne changent pas pendant le comptage ; deux libellés identiques casseraient une clé par libellé
					<View key={index} style={styles.row}>
						<Text style={styles.label}>{token.label}</Text>
						<NumberStepper
							value={counts[index] ?? 0}
							onChange={(n) => setCounts((current) => current.map((c, i) => (i === index ? n : c)))}
							min={0}
							accentColor={accentColor}
							label={token.label}
						/>
					</View>
				))}
			</ScrollView>

			<View style={styles.totalRow}>
				<Text style={styles.totalLabel}>Total</Text>
				<Text
					style={[
						styles.totalValue,
						{ color: readableTint(accentColor, colors.surface, colors.text) },
					]}
				>
					{total}
				</Text>
			</View>

			<Button
				label="Valider"
				onPress={() => {
					onConfirm(total);
					onClose();
				}}
			/>
		</BottomSheet>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				list: {
					gap: SPACING.sm,
					paddingBottom: SPACING.sm,
				},
				row: {
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
					gap: SPACING.sm,
				},
				label: {
					flex: 1,
					color: colors.text,
					fontSize: 14,
				},
				totalRow: {
					flexDirection: "row",
					justifyContent: "space-between",
					alignItems: "center",
					paddingVertical: SPACING.sm,
					borderTopWidth: 1,
					borderTopColor: colors.border,
					marginBottom: SPACING.sm,
				},
				totalLabel: {
					color: colors.textMuted,
					fontSize: 14,
					textTransform: "uppercase",
					letterSpacing: 0.5,
				},
				totalValue: {
					fontSize: 20,
					fontWeight: "800",
				},
			}),
		[colors],
	);
}
