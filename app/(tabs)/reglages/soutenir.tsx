import { useMemo } from "react";
import { Linking, Share, StyleSheet, Text, View } from "react-native";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { APP_INFO, LINKS } from "@/constants/app";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

async function shareApp() {
	try {
		await Share.share({
			message: `${APP_INFO.name}, le compteur de scores pour tous tes jeux de société : ${LINKS.releases}`,
		});
	} catch {
		// Partage annulé ou indisponible : rien à faire.
	}
}

export default function SupportSettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<ScreenContainer style={styles.container}>
			<View style={styles.card}>
				<Text style={styles.text}>
					{APP_INFO.name} est gratuite, sans publicité et sans option payante. Si elle anime tes
					soirées jeux, un petit café fait toujours plaisir 🙂
				</Text>
			</View>
			<SettingsRow
				icon="cafe"
				label="M'offrir un café"
				value="Sur Buy Me a Coffee"
				onPress={() => Linking.openURL(LINKS.donation)}
			/>
			<SettingsRow
				icon="share-social"
				label="Partager l'app"
				value="À tes partenaires de jeu"
				onPress={shareApp}
			/>
			<SettingsRow
				icon="bug"
				label="Signaler un bug ou proposer une idée"
				value="Sur GitHub"
				onPress={() => Linking.openURL(LINKS.issues)}
			/>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.sm,
				},
				card: {
					backgroundColor: colors.surface,
					borderRadius: RADIUS.md,
					padding: SPACING.md,
					marginBottom: SPACING.sm,
				},
				text: {
					color: colors.text,
					fontSize: 14,
					lineHeight: 20,
				},
			}),
		[colors],
	);
}
