import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ManualPointsFields } from "@/components/scoring/ManualPointsFields";
import { TokenCounterSheet } from "@/components/scoring/TokenCounterSheet";
import { SPACING } from "@/constants/theme";
import type { TokenDenomination } from "@/lib/tokens";

type Props = {
	points: number;
	color: string;
	label: string;
	tokens: TokenDenomination[];
	onChange: (value: number) => void;
};

/** Catégorie "compteur de jetons" : total ajustable à la main (comme une catégorie "manuel"), avec
 * en plus un lien vers la calculette de jetons pour ne pas avoir à faire l'addition soi-même. */
export function TokenScoreField({ points, color, label, tokens, onChange }: Props) {
	const [visible, setVisible] = useState(false);

	return (
		<View>
			<ManualPointsFields points={points} color={color} onChange={onChange} />
			<Pressable onPress={() => setVisible(true)} hitSlop={8} style={styles.link}>
				<Text style={[styles.linkText, { color }]}>Compter par jetons</Text>
			</Pressable>
			<TokenCounterSheet
				visible={visible}
				onClose={() => setVisible(false)}
				title={label}
				tokens={tokens}
				accentColor={color}
				onConfirm={onChange}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	link: {
		alignSelf: "center",
		marginTop: SPACING.xs,
	},
	linkText: {
		fontSize: 13,
		fontWeight: "600",
	},
});
