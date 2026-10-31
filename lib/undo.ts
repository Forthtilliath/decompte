import { showToast } from "@forthtilliath/react-native-kit/components/feedback/toast";

/** Durée pendant laquelle l'action reste annulable (allongée si TalkBack demande plus de temps). */
export const UNDO_DELAY_MS = 5000;

/**
 * Action déjà faite : propose de l'annuler quelques secondes dans la barre du bas, qui survit à la
 * navigation (`UndoHost`) et remplace la proposition précédente. Non persisté : une annulation ne
 * survit pas à la fermeture de l'app, l'action reste alors faite.
 */
export function offerUndo(message: string, undo: () => void): void {
	showToast(message, { action: { label: "Annuler", onPress: undo }, durationMs: UNDO_DELAY_MS });
}
