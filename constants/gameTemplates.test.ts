import { GAME_TEMPLATES } from "@/constants/gameTemplates";
import { parseGameTemplate } from "@/lib/gameExport";

describe("modèles de jeux", () => {
	it.each(GAME_TEMPLATES.map((t) => [t.id, t] as const))("%s est un jeu valide", (_, template) => {
		const result = parseGameTemplate(template.game);
		if (!result.ok) throw new Error(result.error);
		expect(result.game.name).toBe(template.game.name);
	});

	it("n'a pas deux modèles au même id ni au même nom", () => {
		expect(new Set(GAME_TEMPLATES.map((t) => t.id)).size).toBe(GAME_TEMPLATES.length);
		expect(new Set(GAME_TEMPLATES.map((t) => t.game.name)).size).toBe(GAME_TEMPLATES.length);
	});
});
