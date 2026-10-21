import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * `true` quand l'utilisateur a demandé moins d'animations (Android : Accessibilité ▸ Supprimer
 * les animations). Les transitions natives s'y plient seules, pas celles d'`Animated`.
 */
export function useReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		let mounted = true;
		AccessibilityInfo.isReduceMotionEnabled()
			.then((value) => {
				if (mounted) setReduced(value);
			})
			.catch(() => {
				/* inconnu : animations gardées */
			});
		const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduced);
		return () => {
			mounted = false;
			subscription.remove();
		};
	}, []);

	return reduced;
}
