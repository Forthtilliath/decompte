import { useBackupState, useCloudBackupProblem } from "@forthtilliath/expo-backup-ui/hooks";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { APP_INFO } from "@/constants/app";
import { findPageBackground } from "@/constants/backgrounds";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { backup } from "@/lib/backup";
import { THEME_LABELS, useThemeStore } from "@/stores/themeStore";

export default function SettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const mode = useThemeStore((s) => s.mode);
	const backgroundId = useThemeStore((s) => s.backgrounds[mode]);
	const background = findPageBackground(mode, backgroundId);
	const cloudAccount = useBackupState(backup).cloudAccount;
	const backupProblem = useCloudBackupProblem(backup);

	const backupPreview = backupProblem
		? "La sauvegarde automatique échoue"
		: cloudAccount
			? `Google Drive : ${cloudAccount.email}`
			: "Google Drive, export ou restauration";

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.section}>Préférences</Text>
				<SettingsRow
					icon="contrast"
					label="Apparence"
					value={`${THEME_LABELS[mode]}, fond ${background.label.toLowerCase()}`}
					onPress={() => router.push("/reglages/apparence")}
				/>

				<Text style={styles.section}>Données</Text>
				<SettingsRow
					icon={backupProblem ? "warning" : "cloud-upload"}
					label="Sauvegarde et restauration"
					value={backupPreview}
					danger={backupProblem != null}
					onPress={() => router.push("/reglages/sauvegarde")}
				/>

				<Text style={styles.section}>Application</Text>
				<SettingsRow
					icon="download"
					label="Mises à jour"
					value={`Version ${APP_INFO.version}, nouveautés`}
					onPress={() => router.push("/reglages/mises-a-jour")}
				/>
				<SettingsRow
					icon="cafe"
					label="Soutenir le projet"
					value="Offrir un café, partager, signaler un bug"
					onPress={() => router.push("/reglages/soutenir")}
				/>
				<SettingsRow
					icon="information-circle"
					label="À propos"
					value="L'app, tes données"
					onPress={() => router.push("/reglages/a-propos")}
				/>
				<SettingsRow
					icon="warning"
					label="Zone dangereuse"
					value="Effacer toutes les données"
					danger
					onPress={() => router.push("/reglages/zone-dangereuse")}
				/>

				<Text style={styles.version}>
					{APP_INFO.name} · v{APP_INFO.version}
				</Text>
			</ScrollView>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.sm,
					padding: SPACING.md,
				},
				section: {
					color: colors.textMuted,
					fontSize: 13,
					fontWeight: "700",
					textTransform: "uppercase",
					letterSpacing: 0.5,
					marginTop: SPACING.sm,
				},
				version: {
					color: colors.textMuted,
					textAlign: "center",
					fontSize: 12,
					paddingTop: SPACING.lg,
				},
			}),
		[colors],
	);
}
