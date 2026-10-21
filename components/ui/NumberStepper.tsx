import { usePressRepeat } from "@forthtilliath/react-native-kit/hooks/usePressRepeat";
import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { readableTextOn } from "@forthtilliath/ts-kit/color/contrastRatio";
import { clamp } from "@forthtilliath/ts-kit/number/clamp";
import { useEffect, useMemo, useRef, useState } from "react";
import type { TextInputInstance } from "react-native";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, TIGHT_FONT_SCALE } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { parseIntegerInput, sanitizeIntegerInput } from "@/lib/numbers";

type Props = {
	value: number;
	onChange: (value: number) => void;
	/** Sans minimum, les valeurs négatives sont permises. Pas de valeur par défaut : un `min = 0`
	 * écraserait aussi un `min={undefined}` explicite (ex. catégorie qui autorise le négatif). */
	min?: number;
	max?: number;
	step?: number;
	accentColor?: string;
	/** Décrit ce que compte le stepper (ex. "Roues"), repris dans les libellés d'accessibilité des
	 * boutons +/- pour un lecteur d'écran ("Diminuer Roues" plutôt que juste "Diminuer"). */
	label?: string;
	/** Enchaîne ce champ avec le suivant au clavier (touche Entrée). */
	chain?: KeyboardChain;
};

/**
 * Enchaînement de champs à la touche Entrée : `inputRef` fait connaître le champ à celui qui le
 * pilote, `onSubmit` passe à la suite. Le clavier reste ouvert, pour enchaîner sans le recharger.
 */
export type KeyboardChain = {
	inputRef: (input: TextInputInstance | null) => void;
	onSubmit: () => void;
};

// Garde son propre stepper plutôt que le QuantityStepper de la lib, qui n'a ni `step`, ni retour
// haptique, ni bornes optionnelles (noté dans A-FAIRE.md de forthtilliath-packages).
export function NumberStepper({
	value,
	onChange,
	min,
	max,
	step = 1,
	accentColor,
	label,
	chain,
}: Props) {
	const bound = (n: number) => clamp(n, min ?? -Infinity, max ?? Infinity);

	// Suit la valeur courante pendant une répétition, indépendamment des re-renders déclenchés par
	// chaque onChange (la prop `value` du render en cours pourrait être en retard d'un tick).
	const valueRef = useRef(value);
	useEffect(() => {
		valueRef.current = value;
	}, [value]);

	// Un premier pas immédiat, puis une répétition qui s'accélère pour saisir vite les grandes
	// valeurs. `start` arrête d'abord la répétition en cours : sur une tape de moins de 130 ms,
	// React Native retarde onPressOut et l'appui suivant l'annule.
	const repeat = usePressRepeat();

	const stepOnce = (direction: 1 | -1) => {
		const next = bound(valueRef.current + direction * step);
		// Borne atteinte : la répétition n'a plus rien à faire.
		if (next === valueRef.current) repeat.stop();
		else tapFeedback();
		valueRef.current = next;
		onChange(next);
	};

	const startPress = (direction: 1 | -1) => repeat.start(() => stepOnce(direction));
	const stopRepeat = repeat.stop;

	const colors = useColors();
	const styles = useStyles(colors);
	const color = accentColor ?? colors.primary;
	// Le blanc ne se lit pas sur toutes les couleurs de catégorie (citron vert, ambre…).
	const labelColor = { color: readableTextOn(color) };
	// "number-pad" a un clavier purement numérique, sans touche "-" sur Android. Dès qu'un
	// négatif est possible, on bascule sur "numeric" qui affiche le signe.
	const allowsNegative = min === undefined || min < 0;
	// Bouton grisé à la borne. Pas de `disabled` sur le Pressable : le bouton se désactiverait en
	// plein appui long, et onPressOut, qui arrête la répétition, pourrait ne jamais arriver.
	const atMin = min !== undefined && value <= min;
	const atMax = max !== undefined && value >= max;

	// Texte affiché, distinct de `value` : le temps de taper "-13", l'état intermédiaire ("-",
	// "-1"...) n'est pas un nombre valide et ne doit pas être écrasé par la valeur committée.
	const [text, setText] = useState(String(value));

	useEffect(() => {
		setText(String(value));
	}, [value]);

	const commit = (raw: string) => {
		const parsed = parseIntegerInput(raw);
		if (parsed !== null) onChange(bound(parsed));
	};

	return (
		<View style={styles.row}>
			<Pressable
				style={[styles.button, { backgroundColor: color }, atMin && styles.buttonAtBound]}
				onPressIn={() => startPress(-1)}
				onPressOut={stopRepeat}
				accessibilityRole="button"
				accessibilityState={{ disabled: atMin }}
				accessibilityLabel={label ? `Diminuer ${label}` : "Diminuer"}
			>
				<Text style={[styles.buttonLabel, labelColor]} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
					–
				</Text>
			</Pressable>

			<TextInput
				ref={chain?.inputRef}
				returnKeyType={chain ? "next" : undefined}
				submitBehavior={chain ? "submit" : undefined}
				onSubmitEditing={chain?.onSubmit}
				style={styles.value}
				keyboardType={allowsNegative ? "numeric" : "number-pad"}
				value={text}
				onChangeText={(raw) => {
					const cleaned = sanitizeIntegerInput(raw, allowsNegative);
					setText(cleaned);
					commit(cleaned);
				}}
				onBlur={() => setText(String(value))}
				selectTextOnFocus
				maxFontSizeMultiplier={TIGHT_FONT_SCALE}
				accessibilityLabel={label}
			/>

			<Pressable
				style={[styles.button, { backgroundColor: color }, atMax && styles.buttonAtBound]}
				onPressIn={() => startPress(1)}
				onPressOut={stopRepeat}
				accessibilityRole="button"
				accessibilityState={{ disabled: atMax }}
				accessibilityLabel={label ? `Augmenter ${label}` : "Augmenter"}
			>
				<Text style={[styles.buttonLabel, labelColor]} maxFontSizeMultiplier={TIGHT_FONT_SCALE}>
					+
				</Text>
			</Pressable>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				row: {
					flexDirection: "row",
					alignItems: "center",
					gap: 8,
				},
				button: {
					width: 40,
					height: 40,
					borderRadius: RADIUS.sm,
					alignItems: "center",
					justifyContent: "center",
				},
				// Même opacité que les boutons désactivés (components/ui/Button).
				buttonAtBound: {
					opacity: 0.4,
				},
				buttonLabel: {
					fontSize: 20,
					fontWeight: "700",
				},
				value: {
					minWidth: 48,
					textAlign: "center",
					color: colors.text,
					fontSize: 18,
					fontWeight: "700",
				},
			}),
		[colors],
	);
}
