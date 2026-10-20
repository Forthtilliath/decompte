import { File, Paths } from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { UPDATE_APK_FILE_NAME } from "@/constants/app";
import { expectedApkSha256, isReleaseApkUrl } from "@/lib/appUpdate";

/** `Intent.FLAG_GRANT_READ_URI_PERMISSION` : l'installeur lit l'APK par son adresse `content://`. */
const FLAG_GRANT_READ_URI_PERMISSION = 1;

/**
 * Télécharge l'APK d'une release de l'app (adresse et empreinte SHA-256 issues de
 * `fetchLatestRelease`), vérifie son empreinte, puis le confie à l'installeur d'Android, qui
 * demande confirmation et refuse un APK qui ne serait pas signé avec la même clé que l'app.
 *
 * Remplace `downloadAndInstallApk` de `@forthtilliath/expo-release-updates`, qui ne vérifie que le
 * domaine de l'adresse et une empreinte MD5, alors que GitHub publie une empreinte SHA-256.
 */
export async function installApk(apkUrl: string, onProgress?: (fraction: number) => void) {
	if (!isReleaseApkUrl(apkUrl)) {
		throw new Error("Adresse de téléchargement inattendue : installation annulée.");
	}
	const expectedSha256 = expectedApkSha256(apkUrl);
	if (!expectedSha256) {
		throw new Error("Empreinte de la mise à jour inconnue : relance la vérification.");
	}

	const destination = new File(Paths.cache, UPDATE_APK_FILE_NAME);
	if (destination.exists) destination.delete();
	const file = await File.createDownloadTask(apkUrl, destination, {
		onProgress: ({ bytesWritten, totalBytes }) => {
			if (totalBytes > 0) onProgress?.(bytesWritten / totalBytes);
		},
	}).downloadAsync();
	if (!file) throw new Error("Le téléchargement a échoué.");

	if ((await file.digest("SHA-256")) !== expectedSha256) {
		file.delete();
		throw new Error(
			"Fichier téléchargé abîmé ou modifié (empreinte différente) : installation annulée.",
		);
	}

	await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
		data: file.contentUri,
		flags: FLAG_GRANT_READ_URI_PERMISSION,
		type: "application/vnd.android.package-archive",
	});
}
