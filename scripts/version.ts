/** Arguments de `npm run bump` : un mot-clé de `npm version`, ou une version exacte. */
const BUMP_ARG =
	/^(major|minor|patch|premajor|preminor|prepatch|prerelease|\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?)$/;

export function isBumpArg(arg: string): boolean {
	return BUMP_ARG.test(arg);
}

/** Remplace la seule occurrence de `pattern` dans `text`, ou échoue s'il y en a zéro ou plusieurs. */
function replaceOnce(text: string, pattern: RegExp, replacement: string): string {
	const matches = text.match(new RegExp(pattern.source, "g")) ?? [];
	if (matches.length !== 1) {
		throw new Error(`app.json : ${matches.length} occurrence(s) de ${pattern.source}, 1 attendue`);
	}
	return text.replace(pattern, replacement);
}

/**
 * Reporte `version` dans le texte d'app.json et incrémente `android.versionCode` (Android refuse
 * d'installer une mise à jour dont le versionCode ne monte pas). Remplacement dans le texte plutôt
 * que `JSON.stringify`, pour garder la mise en forme du fichier.
 */
export function bumpAppJson(text: string, version: string): { text: string; versionCode: number } {
	const current = JSON.parse(text).expo?.android?.versionCode;
	if (!Number.isInteger(current)) throw new Error("app.json : android.versionCode introuvable");
	const versionCode = current + 1;

	let next = replaceOnce(text, /"version":\s*"[^"]*"/, `"version": "${version}"`);
	next = replaceOnce(next, /"versionCode":\s*\d+/, `"versionCode": ${versionCode}`);

	const parsed = JSON.parse(next).expo;
	if (parsed.version !== version || parsed.android.versionCode !== versionCode) {
		throw new Error("app.json : la version n'a pas été reportée au bon endroit");
	}
	return { text: next, versionCode };
}
