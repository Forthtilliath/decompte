import appJson from "@/app.json";
import { APP_INFO } from "@/constants/app";

describe("APP_INFO", () => {
	// Android affiche la version d'app.json, l'app compare celle de package.json aux releases :
	// un écart ferait proposer en boucle une version déjà installée, ou jamais la suivante.
	it("a la même version que app.json", () => {
		expect(APP_INFO.version).toBe(appJson.expo.version);
	});
});
