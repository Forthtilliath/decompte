import { type ReactNode, useEffect, useRef } from "react";
import { Animated } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type Props = {
	/** Position dans la liste : chaque élément apparaît un peu après le précédent. */
	index: number;
	/** Arrivée plus marquée (léger rebond), pour le vainqueur. */
	emphasis?: boolean;
	children: ReactNode;
};

const STAGGER_MS = 90;
const DURATION_MS = 260;

/** Apparition en fondu et glissé vers le haut, décalée selon `index` (révélation d'un classement). */
export function Reveal({ index, emphasis = false, children }: Props) {
	const reducedMotion = useReducedMotion();
	const progress = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		if (reducedMotion) {
			progress.setValue(1);
			return;
		}
		const animation = emphasis
			? Animated.spring(progress, {
					toValue: 1,
					delay: index * STAGGER_MS,
					friction: 5,
					useNativeDriver: true,
				})
			: Animated.timing(progress, {
					toValue: 1,
					delay: index * STAGGER_MS,
					duration: DURATION_MS,
					useNativeDriver: true,
				});
		animation.start();
		return () => animation.stop();
	}, [progress, index, emphasis, reducedMotion]);

	const style = {
		opacity: progress.interpolate({
			inputRange: [0, 1],
			outputRange: [0, 1],
			extrapolate: "clamp",
		}),
		transform: [
			{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
			...(emphasis
				? [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }]
				: []),
		],
	};

	return <Animated.View style={style}>{children}</Animated.View>;
}
