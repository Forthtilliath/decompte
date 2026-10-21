import { downloadAndInstallApk } from "@forthtilliath/expo-release-updates/downloadAndInstallApk";
import { UPDATE_APK_FILE_NAME } from "@/constants/app";
import { RELEASE_DOWNLOADS } from "@/lib/appUpdate";

/**
 * Télécharge l'APK d'une release de l'app (adresse et empreinte SHA-256 issues de
 * `fetchLatestRelease`), vérifie son empreinte, puis le confie à l'installeur d'Android, qui
 * demande confirmation et refuse un APK qui ne serait pas signé avec la même clé que l'app.
 * Seul un fichier des releases de ce dépôt est accepté, et jamais sans empreinte.
 */
export async function installApk(
	apkUrl: string,
	onProgress?: (fraction: number) => void,
	apkSha256?: string,
) {
	if (!apkSha256) {
		throw new Error("Empreinte de la mise à jour inconnue : installation annulée.");
	}
	await downloadAndInstallApk({
		apkUrl,
		fileName: UPDATE_APK_FILE_NAME,
		onProgress,
		expectedSha256: apkSha256,
		allowedUrlPrefix: RELEASE_DOWNLOADS,
	});
}
