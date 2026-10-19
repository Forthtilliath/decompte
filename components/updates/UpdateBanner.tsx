import type { UpdateAvailableBannerStyles } from "@forthtilliath/expo-release-updates-ui/UpdateAvailableBanner";
import type { UpdateInstallCardStyles } from "@forthtilliath/expo-release-updates-ui/UpdateInstallCard";
import { UpdateNotifier } from "@forthtilliath/expo-release-updates-ui/UpdateNotifier";
import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { installApk } from "@/components/updates/installApk";
import { APP_INFO } from "@/constants/app";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { fetchLatestRelease } from "@/lib/appUpdate";
import { useUpdateStore, useUpdateStoreHydrated } from "@/stores/updateStore";

// Les notes d'une release prendraient tout l'écran : le bandeau s'en tient à la version, les
// nouveautés restent dans Réglages ▸ Mises à jour.
async function fetchLatestReleaseWithoutNotes() {
	const release = await fetchLatestRelease();
	return release && { ...release, notes: "" };
}

/**
 * Annonce une nouvelle version au lancement (au plus une vérification GitHub toutes les 12 h) :
 * « Installer » télécharge l'APK et lance l'installation en un geste, « Ignorer » ne propose plus
 * cette version. Rien ne s'affiche si l'app est à jour ou si la vérification échoue (hors ligne…).
 */
export function UpdateBanner() {
	const colors = useColors();
	const bannerStyles = useBannerStyles(colors);
	const installCardStyles = useUpdateInstallCardStyles(colors);
	const hydrated = useUpdateStoreHydrated();
	const setLastCheckedAt = useUpdateStore((s) => s.setLastCheckedAt);
	const dismissVersion = useUpdateStore((s) => s.dismissVersion);

	return (
		<UpdateNotifier
			enabled={hydrated}
			currentVersion={APP_INFO.version}
			checkForUpdate={fetchLatestReleaseWithoutNotes}
			getLastCheck={() => useUpdateStore.getState()}
			onChecked={setLastCheckedAt}
			onDismissVersion={dismissVersion}
			downloadAndInstallApk={installApk}
			labels={{ banner: { title: (version) => `Nouvelle version ${version} disponible` } }}
			styles={{ banner: bannerStyles, install: installCardStyles }}
		/>
	);
}

function useBannerStyles(colors: ThemeColors): UpdateAvailableBannerStyles {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					borderWidth: 1,
					borderColor: colors.gold,
					padding: SPACING.md,
					gap: SPACING.sm,
				},
				title: { flexShrink: 1, color: colors.text, fontSize: 15, fontWeight: "700" },
				actionButton: { backgroundColor: colors.primary, borderRadius: RADIUS.sm },
				actionButtonText: { color: colors.primaryText },
				dismissButtonText: { color: colors.textMuted, fontWeight: "600" },
			}),
		[colors],
	);
}

/** Thème de la carte de progression du téléchargement de l'APK. */
function useUpdateInstallCardStyles(colors: ThemeColors): UpdateInstallCardStyles {
	return useMemo(() => {
		const styles = StyleSheet.create({
			container: {
				alignSelf: "stretch",
				backgroundColor: colors.surface,
				borderRadius: RADIUS.md,
			},
			title: { color: colors.text },
			hint: { color: colors.textMuted },
			error: { color: colors.danger },
			retryButton: { backgroundColor: colors.primary, borderRadius: RADIUS.sm },
			retryButtonText: { color: colors.primaryText },
		});
		return { ...styles, closeButtonText: styles.hint };
	}, [colors]);
}
