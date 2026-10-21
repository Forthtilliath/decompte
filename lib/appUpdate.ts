import {
	fetchLatestRelease as fetchGithubLatestRelease,
	fetchReleaseHistory as fetchGithubReleaseHistory,
	type LatestRelease,
	type ReleaseHistoryEntry,
	releaseDownloadUrlPrefix,
} from "@forthtilliath/expo-release-updates/githubReleases";
import { compareVersions } from "@forthtilliath/ts-kit/version/compareVersions";
import { RELEASES_REPO } from "@/constants/app";

/** Maximum accepté par GitHub en une page : bien au-delà du nombre de releases du dépôt. */
const HISTORY_LIMIT = 100;

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

/**
 * Toutes les versions publiées, la plus récente en premier. Triées ici : GitHub les classe par
 * date de création de la release, pas par version (une release recréée remonte en tête).
 */
export async function fetchSortedReleaseHistory(): Promise<ReleaseHistoryEntry[]> {
	const history = await fetchGithubReleaseHistory({ ...RELEASES_REPO, limit: HISTORY_LIMIT });
	return history.sort((a, b) => compareVersions(b.version, a.version));
}
