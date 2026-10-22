import {
	UpdateSettingsScreen,
	type UpdateSettingsScreenStyles,
} from "@forthtilliath/react-native-kit/components/settings/UpdateSettingsScreen";
import { compareVersions } from "@forthtilliath/ts-kit/version/compareVersions";
import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { installApk } from "@/components/updates/installApk";
import { APP_INFO } from "@/constants/app";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { usePagedReleaseHistory } from "@/hooks/usePagedReleaseHistory";
import { fetchLatestRelease } from "@/lib/appUpdate";

export default function UpdateSettingsPage() {
	const colors = useColors();
	const updateStyles = useUpdateScreenStyles(colors);
	const { fetchHistory, scrollProps } = usePagedReleaseHistory();

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content} {...scrollProps}>
				<UpdateSettingsScreen
					currentVersion={APP_INFO.version}
					checkForUpdate={fetchLatestRelease}
					compareVersions={compareVersions}
					downloadAndInstallApk={installApk}
					fetchReleaseHistory={fetchHistory}
					styles={updateStyles}
				/>
			</ScrollView>
		</ScreenContainer>
	);
}

function useUpdateScreenStyles(colors: ThemeColors): UpdateSettingsScreenStyles {
	return useMemo(() => {
		const card = {
			backgroundColor: colors.surface,
			borderColor: colors.border,
			borderRadius: RADIUS.md,
			...colors.decor.card,
		};
		return {
			infoBox: card,
			infoLabel: { color: colors.textMuted },
			infoValue: { color: colors.text },
			helpText: { color: colors.textMuted },
			errorText: { color: colors.danger },
			button: { backgroundColor: colors.primary, borderRadius: RADIUS.md },
			buttonText: { color: colors.primaryText },
			activityIndicatorColor: colors.primaryText,
			updateAvailableBox: { ...card, borderColor: colors.gold },
			updateAvailableTitle: { color: colors.text },
			changelogTitle: { color: colors.text },
			changelogEntry: card,
			changelogVersion: { color: colors.text },
			changelogDate: { color: colors.textMuted },
			notes: {
				heading: { color: colors.text },
				bullet: { color: colors.primary },
				itemText: { color: colors.textMuted },
				text: { color: colors.textMuted },
				bold: { color: colors.text, fontWeight: "700" },
			},
		};
	}, [colors]);
}

const styles = StyleSheet.create({
	content: {
		padding: SPACING.md,
		paddingBottom: SPACING.xl,
	},
});
