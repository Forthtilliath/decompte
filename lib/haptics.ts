import * as Haptics from "expo-haptics";

// Petits alias sémantiques plutôt que d'appeler `expo-haptics` directement partout : plus lisible
// à l'usage ("tapFeedback()" dit ce qu'on fait), et un seul endroit à changer si on affine les
// styles de vibration plus tard. Chaque appel est best-effort : une vibration ratée ne doit jamais
// faire échouer l'action qu'elle accompagne.

/** Retour léger pour une pression sur un bouton ou un pas de stepper. */
export function tapFeedback(): void {
	Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Retour pour une sélection/bascule (case à cocher, bouton radio, chip, carte joueur). */
export function selectFeedback(): void {
	Haptics.selectionAsync().catch(() => {});
}

/** Retour pour une action qui aboutit (ex. fin de partie enregistrée). */
export function successFeedback(): void {
	Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
