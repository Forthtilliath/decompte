import { useEffect, useMemo, useRef } from "react";
import { PanResponder } from "react-native";

/** Mouvement à partir duquel le balayage prend la main sur les boutons qu'il survole. */
const CLAIM_DISTANCE = 24;
/** Distance à parcourir pour que le balayage compte. */
const SWIPE_DISTANCE = 80;

type Handlers = {
	/** Doigt vers la gauche : passer à la suite. */
	onSwipeLeft?: () => void;
	/** Doigt vers la droite : revenir en arrière. */
	onSwipeRight?: () => void;
};

/**
 * Gestionnaires à poser sur une vue pour réagir à un balayage horizontal. Seul un mouvement
 * franchement horizontal est pris : le défilement vertical et les appuis restent intacts.
 */
export function useHorizontalSwipe(handlers: Handlers) {
	// Le PanResponder garde l'état du geste en cours : il est créé une fois, et lit toujours les
	// derniers gestionnaires (recréés à chaque rendu par l'écran).
	const latest = useRef(handlers);
	useEffect(() => {
		latest.current = handlers;
	});

	return useMemo(
		() =>
			PanResponder.create({
				onMoveShouldSetPanResponderCapture: (_, { dx, dy }) =>
					Math.abs(dx) > CLAIM_DISTANCE && Math.abs(dx) > Math.abs(dy) * 2,
				onPanResponderRelease: (_, { dx }) => {
					if (dx <= -SWIPE_DISTANCE) latest.current.onSwipeLeft?.();
					else if (dx >= SWIPE_DISTANCE) latest.current.onSwipeRight?.();
				},
			}).panHandlers,
		[],
	);
}
