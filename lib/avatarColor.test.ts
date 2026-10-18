import { AVATAR_PALETTE, getAvatarColor } from "@/lib/avatarColor";

describe("getAvatarColor", () => {
	it("donne toujours la même couleur pour le même identifiant", () => {
		expect(getAvatarColor("abc123")).toBe(getAvatarColor("abc123"));
	});

	it("reste dans la palette, y compris pour une chaîne vide ou très longue", () => {
		for (const seed of ["", "a", "Zoé", "x".repeat(5000), "🎲🎲"]) {
			expect(AVATAR_PALETTE).toContain(getAvatarColor(seed));
		}
	});

	it("répartit des identifiants différents sur plusieurs couleurs", () => {
		const colors = new Set(Array.from({ length: 100 }, (_, i) => getAvatarColor(`player-${i}`)));
		expect(colors.size).toBeGreaterThan(AVATAR_PALETTE.length / 2);
	});

	// Les couleurs déjà attribuées ne doivent pas changer après une mise à jour : on fige quelques
	// valeurs connues (changer l'algorithme ou la palette repeindrait tous les avatars existants).
	it("garde les couleurs déjà attribuées (algorithme et palette figés)", () => {
		expect(getAvatarColor("Alice")).toBe("#f43f5e");
		expect(getAvatarColor("V1StGXR8_Z5jdHi6B-myT")).toBe("#a855f7");
	});
});

describe("AVATAR_PALETTE", () => {
	it("ne contient que des couleurs hexadécimales distinctes", () => {
		for (const color of AVATAR_PALETTE) expect(color).toMatch(/^#[0-9a-f]{6}$/);
		expect(new Set(AVATAR_PALETTE).size).toBe(AVATAR_PALETTE.length);
	});
});
