import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Props = {
	/** Avancement de 0 à 1 (étape courante / nombre d'étapes). */
	progress: number;
	color: string;
};

// Chaque étape est un nouvel écran : on retient ici où en était la barre de l'écran précédent pour
// la faire glisser de là (vers l'avant comme vers l'arrière), plutôt que de repartir de zéro.
let lastProgress = 0;

/** Barre d'avancement de la saisie, à la couleur de la catégorie, qui glisse d'une étape à l'autre. */
export function StepProgressBar({ progress, color }: Props) {
	const colors = useColors();
	const reducedMotion = useReducedMotion();
	// Grand recul (nouvelle partie, reprise) : la barre part de zéro, pas de la fin de la partie
	// précédente. Un pas en arrière pendant la saisie, lui, reste animé depuis l'étape quittée.
	const width = useRef(new Animated.Value(progress <= lastProgress / 2 ? 0 : lastProgress)).current;

	useEffect(() => {
		lastProgress = progress;
		if (reducedMotion) {
			width.setValue(progress);
			return;
		}
		// Largeur en pourcentage : pas d'animation native possible, mais une seule vue à animer.
		const animation = Animated.timing(width, {
			toValue: progress,
			duration: 300,
			useNativeDriver: false,
		});
		animation.start();
		return () => animation.stop();
	}, [width, progress, reducedMotion]);

	return (
		<View
			style={[styles.track, { backgroundColor: colors.surfaceAlt }]}
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			<Animated.View
				style={[
					styles.fill,
					{
						backgroundColor: color,
						width: width.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
					},
				]}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	track: {
		height: 4,
	},
	fill: {
		height: "100%",
	},
});
