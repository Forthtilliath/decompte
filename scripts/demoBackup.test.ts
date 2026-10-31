import { parseBackup } from "@/lib/backupSchema";
import { buildDemoBackup } from "@/scripts/demoBackup";

describe("buildDemoBackup", () => {
	it("produit une sauvegarde que l'app accepte de restaurer", () => {
		const backup = buildDemoBackup();
		const parsed = parseBackup(JSON.stringify(backup));

		expect(parsed.games).toHaveLength(backup.games.length);
		expect(parsed.players).toHaveLength(8);
		expect(parsed.sessions).toHaveLength(backup.sessions.length);
	});

	it("donne le même fichier à chaque exécution", () => {
		expect(JSON.stringify(buildDemoBackup())).toBe(JSON.stringify(buildDemoBackup()));
	});
});
