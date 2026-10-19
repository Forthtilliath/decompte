import { AboutSettingsScreen } from "@forthtilliath/react-native-kit/components/settings/AboutSettingsScreen";
import { useMemo } from "react";
import { Linking, ScrollView, StyleSheet } from "react-native";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { APP_INFO, LINKS } from "@/constants/app";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

export default function AboutScreen() {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content}>
				<AboutSettingsScreen
					appName={APP_INFO.name}
					version={APP_INFO.version}
					developerName={APP_INFO.developer}
					description={[
						`${APP_INFO.name} compte les points de n'importe quel jeu de société : tu décris une fois sa feuille de score, catégorie par catégorie, puis l'app guide la saisie et calcule le classement.`,
					]}
					sections={[
						{
							title: "Tes données",
							paragraphs: [
								"Jeux, joueurs, groupes et parties restent sur ce téléphone, sans compte à créer.",
								"Si tu l'actives, la sauvegarde Google Drive en envoie une copie dans un dossier privé de ton Drive, réservé à l'app et invisible depuis Drive. Elle peut être chiffrée sur le téléphone avant l'envoi.",
								"L'app ne contacte GitHub que pour vérifier les mises à jour. Aucune publicité, aucun outil de suivi.",
							],
						},
					]}
					styles={{
						appName: { color: colors.text, textAlign: "center" },
						version: { color: colors.textMuted, textAlign: "center" },
						separator: { backgroundColor: colors.border },
						paragraph: { color: colors.textMuted },
						sectionTitle: { color: colors.text },
						hint: { color: colors.textMuted },
					}}
				/>
				<SettingsRow
					icon="logo-github"
					label="Code source"
					value="Libre, sur GitHub"
					onPress={() => Linking.openURL(LINKS.sourceCode)}
				/>
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
					paddingBottom: SPACING.xl,
					backgroundColor: colors.background,
				},
			}),
		[colors],
	);
}
