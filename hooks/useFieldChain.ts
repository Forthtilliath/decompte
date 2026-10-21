import { useEffect, useRef } from "react";
import { Keyboard, type TextInputInstance } from "react-native";
import type { KeyboardChain } from "@/components/ui/NumberStepper";

function firstInput(inputs: Map<string, TextInputInstance>, ids: string[]) {
	return ids.map((id) => inputs.get(id)).find((input) => input !== undefined);
}

/**
 * Enchaîne les champs de lignes ordonnées par `ids` : Entrée donne le focus au champ de la ligne
 * suivante, en sautant celles qui n'en ont pas (choix, critère non coché), et sur le dernier appelle
 * `onEnd`. Avec `focusOnMount`, le premier champ prend le focus dès l'affichage, ou le clavier se
 * ferme s'il n'y en a aucun.
 */
export function useFieldChain(ids: string[], focusOnMount: boolean) {
	const inputs = useRef(new Map<string, TextInputInstance>()).current;
	// Une seule fois : réordonner les lignes ne doit pas ramener le focus au premier champ.
	const focusedOnMount = useRef(false);

	useEffect(() => {
		if (!focusOnMount || focusedOnMount.current) return;
		focusedOnMount.current = true;
		const first = firstInput(inputs, ids);
		if (first) first.focus();
		else Keyboard.dismiss();
	}, [focusOnMount, inputs, ids]);

	const chainFor = (id: string, onEnd: () => void): KeyboardChain => ({
		inputRef: (input) => {
			if (input) inputs.set(id, input);
			else inputs.delete(id);
		},
		onSubmit: () => {
			const next = firstInput(inputs, ids.slice(ids.indexOf(id) + 1));
			if (next) next.focus();
			else onEnd();
		},
	});

	return chainFor;
}
