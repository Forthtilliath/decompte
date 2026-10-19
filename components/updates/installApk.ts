import { downloadAndInstallApk } from "@forthtilliath/expo-release-updates/downloadAndInstallApk";
import { UPDATE_APK_FILE_NAME } from "@/constants/app";

/**
 * Télécharge l'APK (github.com uniquement, en https) et le confie à l'installeur d'Android, qui
 * demande confirmation et refuse un APK qui ne serait pas signé avec la même clé que l'app.
 */
export function installApk(apkUrl: string, onProgress?: (fraction: number) => void) {
	return downloadAndInstallApk({ apkUrl, fileName: UPDATE_APK_FILE_NAME, onProgress });
}
