import {
	fetchLatestRelease as fetchGithubLatestRelease,
	type LatestRelease,
	releaseDownloadUrlPrefix,
} from "@forthtilliath/expo-release-updates/githubReleases";
import { RELEASES_REPO } from "@/constants/app";

/** Début de l'adresse de tout fichier attaché à une release de ce dépôt. */
export const RELEASE_DOWNLOADS = releaseDownloadUrlPrefix(RELEASES_REPO);

/**
 * Dernière version publiée avec un APK, pre-releases comprises (les versions de l'app sont des
 * alphas, que `/releases/latest` ignore). Rien n'est proposé que l'installation refuserait : un APK
 * sans empreinte SHA-256 calculée par GitHub, ou hors des releases de ce dépôt.
 */
export async function fetchLatestRelease(): Promise<LatestRelease | null> {
	const latest = await fetchGithubLatestRelease({ ...RELEASES_REPO, includePrereleases: true });
	return latest?.apkSha256 && latest.apkUrl.startsWith(RELEASE_DOWNLOADS) ? latest : null;
}
