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
				.array(z.object({ name: z.string().max(255), browser_download_url: z.string().max(2048) }))
				.max(50),
		}),
	)
	.max(100);

/**
 * Dernière version publiée avec un APK, pre-releases comprises : `fetchLatestRelease` de
 * `@forthtilliath/expo-release-updates` interroge `/releases/latest`, que GitHub réserve aux
 * versions stables, et ne verrait jamais les alphas. Seul un APK servi par github.com est retenu,
 * comme l'exige ensuite `downloadAndInstallApk`.
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
	let latest: LatestRelease | null = null;
	for (const release of releases) {
		if (release.draft) continue;
		const apk = release.assets.find(
			(asset) =>
				asset.name.endsWith(".apk") && asset.browser_download_url.startsWith("https://github.com/"),
		);
		if (!apk) continue;
		const version = release.tag_name.replace(/^v/, "");
		if (!latest || compareVersions(version, latest.version) > 0) {
			latest = { version, notes: release.body ?? "", apkUrl: apk.browser_download_url };
		}
	}
	return latest;
}
