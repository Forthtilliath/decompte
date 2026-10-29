import { shareViewAsImage } from "@forthtilliath/react-native-kit/utils/helpers/shareViewAsImage";
import { type ComponentRef, type RefObject, useRef, useState } from "react";
import { Alert, type View } from "react-native";

/** Attend que React ait rendu le dernier changement d'état et que le natif l'ait dessiné. */
function nextFrames() {
	return new Promise<void>((resolve) =>
		requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
	);
}

/**
 * Partage en image d'une vue rendue à la demande : `capturing` est vrai le temps de la capture,
 * l'écran ne monte la vue (attachée à `ref`) que pendant ce temps. Un échec (capture absente de
 * cette version de l'app, partage indisponible) s'affiche dans une alerte.
 */
export function useViewShare(dialogTitle: string) {
	const ref = useRef<ComponentRef<typeof View>>(null);
	const [capturing, setCapturing] = useState(false);

	const share = async () => {
		if (capturing) return;
		setCapturing(true);
		try {
			await nextFrames();
			// Le kit type la ref avec `View`, qui désigne le composant (et non l'instance) depuis RN 0.88.
			await shareViewAsImage(ref as unknown as RefObject<View | null>, { dialogTitle });
		} catch (error) {
			Alert.alert(
				"Partage impossible",
				error instanceof Error ? error.message : "L'image n'a pas pu être créée.",
			);
		} finally {
			setCapturing(false);
		}
	};

	return { ref, capturing, share };
}
