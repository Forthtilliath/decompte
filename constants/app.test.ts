import appJson from "@/app.json";
import { APP_INFO } from "@/constants/app";

describe("APP_INFO", () => {
	// Android affiche la version d'app.json, l'app compare celle de package.json aux releases :
	// un écart ferait proposer en boucle une version déjà installée, ou jamais la suivante.
	it("a la même version que app.json", () => {
		expect(APP_INFO.version).toBe(appJson.expo.version);
	});
});

describe("règles R8 de l'APK release", () => {
	// WorkManager (widget) crée sa base Room par réflexion au lancement : sans cette règle, R8 en
	// retire le constructeur et l'app se ferme dès l'ouverture (alpha.9 et alpha.10).
	it("garde le constructeur des bases Room", () => {
		const buildProperties = appJson.expo.plugins.find(
			(plugin) => Array.isArray(plugin) && plugin[0] === "expo-build-properties",
		) as [string, { android: { extraProguardRules?: string } }];
		expect(buildProperties[1].android.extraProguardRules).toContain(
			"-keep class * extends androidx.room.RoomDatabase { <init>(); }",
		);
	});
});
