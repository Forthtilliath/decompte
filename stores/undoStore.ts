import { create } from "zustand";

/** Durée pendant laquelle l'action reste annulable. */
export const UNDO_DELAY_MS = 5000;

type PendingUndo = {
	/** Change à chaque action : relance le délai même si le message est identique. */
	id: number;
	message: string;
	undo: () => void;
};

type State = {
	pending: PendingUndo | null;
	/** Action déjà faite : propose de l'annuler quelques secondes (remplace la proposition précédente). */
	offerUndo: (message: string, undo: () => void) => void;
	/** Annule l'action proposée, puis retire la proposition. */
	undo: () => void;
	dismiss: () => void;
};

let nextId = 0;

// Non persisté : une annulation ne survit pas à la fermeture de l'app, l'action reste alors faite.
export const useUndoStore = create<State>()((set, get) => ({
	pending: null,

	offerUndo: (message, undo) => {
		nextId += 1;
		set({ pending: { id: nextId, message, undo } });
	},

	undo: () => {
		const { pending } = get();
		set({ pending: null });
		pending?.undo();
	},

	dismiss: () => set({ pending: null }),
}));
