import { BackupScreen, type BackupScreenStyles } from "@forthtilliath/expo-backup-ui";
import { useMemo } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { backup, describeBackup } from "@/lib/backup";

export default function BackupSettingsScreen() {
	const colors = useColors();
	const backupStyles = useBackupScreenStyles(colors);

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content}>
				<BackupScreen manager={backup} describeBackup={describeBackup} styles={backupStyles} />
			</ScrollView>
		</ScreenContainer>
	);
}

/** Couleurs de l'app sur l'écran partagé d'expo-backup-ui. */
function useBackupScreenStyles(colors: ThemeColors): BackupScreenStyles {
	return useMemo(
		() => ({
			container: { gap: SPACING.md },
			section: {
				backgroundColor: colors.surface,
				borderColor: colors.border,
				borderRadius: RADIUS.md,
				padding: SPACING.md,
				gap: SPACING.sm,
			},
			sectionTitle: { color: colors.text },
			hint: { color: colors.textMuted },
			status: { color: colors.text },
			errorText: { color: colors.danger },
			button: { backgroundColor: colors.primary, borderRadius: RADIUS.sm },
			buttonText: { color: colors.primaryText },
			secondaryButton: { borderColor: colors.primary },
			secondaryButtonText: { color: colors.text },
			ghostButtonText: { color: colors.textMuted },
			switchLabel: { color: colors.text },
			modalCard: { backgroundColor: colors.surface, borderRadius: RADIUS.md },
			recoveryCode: { color: colors.text },
			input: { borderColor: colors.border, color: colors.text },
			placeholderTextColor: colors.textMuted,
		}),
		[colors],
	);
}

const styles = StyleSheet.create({
	content: {
		padding: SPACING.md,
		paddingBottom: SPACING.xl,
	},
});
