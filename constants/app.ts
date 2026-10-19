import packageJson from "@/package.json";

export const APP_INFO = {
	name: "Décompte",
	// Lue depuis package.json plutôt que dupliquée en dur ; app.json porte la même (vérifié par
	// constants/app.test.ts), c'est elle qu'Android affiche et que la mise à jour compare.
	version: packageJson.version,
	developer: "Forthtilliath",
} as const;

/** Dépôt GitHub dont les releases publient l'APK : source unique des mises à jour de l'app. */
export const RELEASES_REPO = { owner: "Forthtilliath", repo: "decompte" } as const;

const REPO_URL = `https://github.com/${RELEASES_REPO.owner}/${RELEASES_REPO.repo}`;

export const LINKS = {
	releases: `${REPO_URL}/releases`,
	issues: `${REPO_URL}/issues`,
	sourceCode: REPO_URL,
	donation: "https://buymeacoffee.com/forthtilliath",
} as const;

/** Nom du fichier local de l'APK téléchargé, écrasé à chaque mise à jour. */
export const UPDATE_APK_FILE_NAME = "decompte-update.apk";
