import { Alert, type AlertButton } from "react-native";

/**
 * Remplace les boîtes de dialogue par une réponse automatique : le bouton choisi par `choose`, ou
 * à défaut le premier qui n'est pas « Annuler ». `choose()` sans argument revient à ce défaut.
 */
export function mockAlert() {
	let choice: string | undefined;
	const spy = jest.spyOn(Alert, "alert").mockImplementation((_title, _message, buttons) => {
		const list = (buttons ?? []) as AlertButton[];
		const button = choice
			? list.find((b) => b.text === choice)
			: list.find((b) => b.style !== "cancel");
		button?.onPress?.();
	});
	return {
		spy,
		choose: (text?: string) => {
			choice = text;
		},
	};
}
