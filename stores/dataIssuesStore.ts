import { create } from "zustand";

/**
 * Données enregistrées qui n'ont pas pu être reprises au lancement, à signaler à l'utilisateur
 * (hooks/useDataIssuesAlert) :
 * - "newer" : écrites par une version plus récente de l'app (retour à un ancien APK) ;
 * - "migration" : aucune conversion écrite depuis leur version, ou conversion en échec ;
 * - "invalid" : illisibles (stockage abîmé, conversion au résultat incorrect).
 * Non persisté : propre à ce lancement.
 */
export type DataIssue = {
	storeName: string;
	kind: "newer" | "migration" | "invalid";
	/** Copie de secours exportable ; null si elle n'a pu être gardée que dans AsyncStorage. */
	copyUri: string | null;
};

type State = {
	issues: DataIssue[];
	clear: () => void;
};

export const useDataIssuesStore = create<State>()((set) => ({
	issues: [],
	clear: () => set({ issues: [] }),
}));

export function reportDataIssue(issue: DataIssue): void {
	useDataIssuesStore.setState((s) => ({ issues: [...s.issues, issue] }));
}
