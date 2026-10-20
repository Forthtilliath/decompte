import { compareVersions } from "@forthtilliath/ts-kit/version/compareVersions";
import { z } from "zod";
import { RELEASES_REPO } from "@/constants/app";

export type LatestRelease = { version: string; notes: string; apkUrl: string };

const TIMEOUT_MS = 15_000;
/** Assez pour sauter quelques releases sans APK (brouillon, notes seules). */
const RELEASES_TO_SCAN = 10;

// Réponse de l'API GitHub, donnée externe : seuls les champs utiles sont gardés, bornés.
const releasesSchema = z
	.array(
		z.object({
			tag_name: z.string().max(100),
			draft: z.boolean(),
			body: z.string().max(100_000).nullable(),
			assets: z
				.array(
					z.object({
						name: z.string().max(255),
						browser_download_url: z.string().max(2048),
						// Calculée par GitHub au dépôt du fichier, absente des très anciens assets.
						digest: z.string().max(100).nullable().optional(),
					}),
				)
				.max(50),
		}),
	)
	.max(100);

// Un APK attaché à une release de ce dépôt, rien d'autre : ni autre dépôt de github.com, ni
// segment `..`, ni paramètre (`[\w.-]` exclut `/`, `?`, `#`, `%` et `@`).
const RELEASE_APK_URL = new RegExp(
	`^https://github\\.com/${RELEASES_REPO.owner}/${RELEASES_REPO.repo}/releases/download/(?!\\.\\.?/)[\\w.-]+/[\\w.-]+\\.apk$`,
);
const SHA256_DIGEST = /^sha256:([0-9a-f]{64})$/;

export function isReleaseApkUrl(url: string): boolean {
	return RELEASE_APK_URL.test(url);
}

/** Empreinte SHA-256 annoncée par GitHub pour chaque APK proposé, par adresse de téléchargement. */
const apkSha256ByUrl = new Map<string, string>();

/**
 * Empreinte que doit avoir l'APK téléchargé depuis `apkUrl` (voir installApk), connue seulement
 * pour une adresse renvoyée par `fetchLatestRelease`.
 */
export function expectedApkSha256(apkUrl: string): string | undefined {
	return apkSha256ByUrl.get(apkUrl);
}

/**
 * Dernière version publiée avec un APK, pre-releases comprises : `fetchLatestRelease` de
 * `@forthtilliath/expo-release-updates` interroge `/releases/latest`, que GitHub réserve aux
 * versions stables, et ne verrait jamais les alphas. Seul un APK de ce dépôt dont GitHub fournit
 * l'empreinte SHA-256 est retenu : l'installation vérifie le fichier téléchargé avec.
 */
export async function fetchLatestRelease(): Promise<LatestRelease | null> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
	let json: unknown;
	try {
		const response = await fetch(
			`https://api.github.com/repos/${RELEASES_REPO.owner}/${RELEASES_REPO.repo}/releases?per_page=${RELEASES_TO_SCAN}`,
			{ headers: { Accept: "application/vnd.github+json" }, signal: controller.signal },
		);
		if (!response.ok) throw new Error(`GitHub a répondu ${response.status}`);
		json = await response.json();
	} finally {
		clearTimeout(timer);
	}

	const releases = releasesSchema.parse(json);
	let latest: (LatestRelease & { sha256: string }) | null = null;
	for (const release of releases) {
		if (release.draft) continue;
		const apk = release.assets
			.filter((asset) => asset.name.endsWith(".apk") && isReleaseApkUrl(asset.browser_download_url))
			.map((asset) => ({ url: asset.browser_download_url, sha256: sha256Of(asset.digest) }))
			.find((asset) => asset.sha256 !== null);
		if (!apk?.sha256) continue;
		const version = release.tag_name.replace(/^v/, "");
		if (!latest || compareVersions(version, latest.version) > 0) {
			latest = { version, notes: release.body ?? "", apkUrl: apk.url, sha256: apk.sha256 };
		}
	}
	if (!latest) return null;
	apkSha256ByUrl.set(latest.apkUrl, latest.sha256);
	return { version: latest.version, notes: latest.notes, apkUrl: latest.apkUrl };
}

function sha256Of(digest: string | null | undefined): string | null {
	return SHA256_DIGEST.exec(digest ?? "")?.[1] ?? null;
}
