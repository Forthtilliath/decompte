// Palette de couleurs saturées, choisies pour rester lisibles avec du texte blanc dessus, aussi
// bien en thème sombre que clair. 18 teintes réparties sur tout le cercle chromatique (au lieu de
// 10) pour que deux entités distinctes se ressemblent moins souvent, même dans un groupe nombreux.
export const AVATAR_PALETTE = [
	"#ef4444", // rouge
	"#f97316", // orange
	"#f59e0b", // ambre
	"#ca8a04", // jaune (foncé, pour rester lisible en blanc dessus)
	"#84cc16", // citron vert
	"#22c55e", // vert
	"#10b981", // émeraude
	"#14b8a6", // sarcelle
	"#06b6d4", // cyan
	"#0ea5e9", // bleu ciel
	"#3b82f6", // bleu
	"#6366f1", // indigo
	"#8b5cf6", // violet
	"#a855f7", // pourpre
	"#d946ef", // fuchsia
	"#ec4899", // rose vif
	"#f43f5e", // rose rouge
	"#78716c", // pierre (neutre, pour varier des teintes vives)
] as const;

/**
 * Couleur de fond déterministe pour un avatar sans photo, dérivée d'un identifiant stable (l'id
 * si disponible, sinon le nom). La même entité garde toujours la même couleur, ce qui facilite le
 * repérage visuel dans les tableaux/graphiques multi-éléments.
 */
export function getAvatarColor(seed: string): string {
	let hash = 0;
	for (let i = 0; i < seed.length; i++) {
		hash = (hash * 31 + seed.charCodeAt(i)) | 0;
	}
	return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
