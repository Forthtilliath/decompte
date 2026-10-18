import { fireEvent, screen } from "@testing-library/react-native";

/**
 * Un appui bref sur un bouton du NumberStepper (qui réagit à pressIn/pressOut, pas à press).
 * Toujours relâcher : un pressIn seul laisse tourner la répétition de l'appui long, et le
 * process Jest ne se termine plus.
 */
export async function tapStepper(name: string): Promise<void> {
	const button = screen.getByRole("button", { name });
	await fireEvent(button, "pressIn");
	await fireEvent(button, "pressOut");
}
