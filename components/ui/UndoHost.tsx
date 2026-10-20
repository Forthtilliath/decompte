import { UndoToast } from "@forthtilliath/react-native-kit/components/list/UndoToast";
import { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { UNDO_DELAY_MS, useUndoStore } from "@/stores/undoStore";

/** Au-dessus de la barre d'onglets, qui occupe le bas de l'écran. */
const TAB_BAR_CLEARANCE = 64;

/**
 * Barre « Annuler » de l'app, affichée par-dessus tous les écrans : l'action qui l'a ouverte
 * (suppression, archivage) quitte souvent l'écran, la barre doit donc survivre à la navigation.
 */
export function UndoHost() {
	const pending = useUndoStore((s) => s.pending);
	const undo = useUndoStore((s) => s.undo);
	const dismiss = useUndoStore((s) => s.dismiss);
	const insets = useSafeAreaInsets();

	useEffect(() => {
		if (!pending) return;
		const timer = setTimeout(dismiss, UNDO_DELAY_MS);
		return () => clearTimeout(timer);
	}, [pending, dismiss]);

	if (!pending) return null;
	return (
		<UndoToast
			message={pending.message}
			onAction={undo}
			styles={{ toast: { bottom: insets.bottom + TAB_BAR_CLEARANCE } }}
		/>
	);
}
