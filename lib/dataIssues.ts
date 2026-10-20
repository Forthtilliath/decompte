import type { DataIssue } from "@/stores/dataIssuesStore";

const STORE_LABELS: Record<string, string> = {
	"games-store": "les jeux",
	"players-store": "les joueurs",
	"groups-store": "les groupes",
	"history-store": "l'historique des parties",
	"session-store": "la partie en cours",
};

const CAUSES: Record<DataIssue["kind"], string> = {
	newer: "Elles viennent d'une version plus récente de Décompte (retour à une version antérieure).",
	migration: "Cette version de Décompte ne sait pas les convertir.",
	invalid: "Elles sont illisibles (stockage abîmé).",
};

/** « a », « a et b », « a, b et c ». */
function joinLabels(labels: string[]): string {
	return labels.length < 2
		? (labels[0] ?? "")
		: `${labels.slice(0, -1).join(", ")} et ${labels[labels.length - 1]}`;
}

/** Texte de l'alerte affichée au lancement quand des données n'ont pas pu être reprises. */
export function describeDataIssues(issues: DataIssue[]): string {
	const labels = [...new Set(issues.map((i) => STORE_LABELS[i.storeName] ?? i.storeName))];
	const causes = [...new Set(issues.map((i) => CAUSES[i.kind]))];
	return [
		`Des données enregistrées sur ce téléphone n'ont pas pu être reprises : ${joinLabels(labels)}.`,
		...causes,
		"Une copie a été gardée telle quelle sur le téléphone : rien n'est effacé.",
		"Si tu as une sauvegarde, restaure-la (Réglages ▸ Sauvegarde et restauration) avant toute modification : la sauvegarde automatique Google Drive remplacerait sinon ta copie en ligne.",
	].join("\n\n");
}

/** URI des copies de secours exportables, sans doublon. */
export function rescueCopyUris(issues: DataIssue[]): string[] {
	return [...new Set(issues.flatMap((i) => (i.copyUri ? [i.copyUri] : [])))];
}
