import { ToastHost } from "@forthtilliath/react-native-kit/components/feedback/ToastHost";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Au-dessus de la barre d'onglets, qui occupe le bas de l'écran. */
const TAB_BAR_CLEARANCE = 64;

/**
 * Barre « Annuler » de l'app (`offerUndo`, lib/undo.ts), affichée par-dessus tous les écrans :
 * l'action qui l'a ouverte (suppression, archivage) quitte souvent l'écran, la barre doit donc
 * survivre à la navigation.
 */
export function UndoHost() {
	const insets = useSafeAreaInsets();
	return <ToastHost bottomOffset={insets.bottom + TAB_BAR_CLEARANCE} maxLines={1} />;
}
