import { nanoid } from "nanoid/non-secure";

/** Génère un identifiant local court, suffisant pour des données stockées uniquement sur l'appareil. */
export function createId(): string {
	return nanoid();
}
