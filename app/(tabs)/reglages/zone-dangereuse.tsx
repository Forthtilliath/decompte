import { useBackupState } from "@forthtilliath/expo-backup-ui/hooks";
import { confirmDestructive } from "@forthtilliath/react-native-kit/utils/helpers/confirmDestructive";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { StyleSheet, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { pruneAvatarPhotos } from "@/lib/avatarPhotos";
import { backup } from "@/lib/backup";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

function clearAllData() {
	useSessionStore.getState().resetSession();
	useHistoryStore.getState().replaceAll([]);
	useGroupsStore.getState().replaceAll([]);
	usePlayersStore.getState().replaceAll([]);
	useGamesStore.getState().replaceAll([]);
	pruneAvatarPhotos([]);
}

export default function DangerZoneSettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const cloudLinked = useBackupState(backup).cloudAccount != null;

	const confirmClear = () => {
		confirmDestructive(
			"Effacer toutes les données ?",
			() => {
				clearAllData();
				router.back();
			},
			{
				message: "Jeux, joueurs, groupes, historique et partie en cours seront supprimés.",
				confirmLabel: "Tout effacer",
			},
		);
	};

	return (
		<ScreenContainer style={styles.container}>
			<Text style={styles.hint}>
				Supprime définitivement de ce téléphone tous les jeux, joueurs, groupes, l'historique des
				parties et la partie en cours. Pense à exporter une sauvegarde avant si tu n'es pas sûr.
			</Text>
			{cloudLinked && (
				<Text style={styles.warning}>
					La sauvegarde Google Drive est active : sa copie sera elle aussi remplacée par des données
					vides. Déconnecte d'abord Google Drive pour la garder.
				</Text>
			)}
			<Button label="Effacer toutes les données" variant="danger" onPress={confirmClear} />
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
				hint: {
					color: colors.textMuted,
					fontSize: 14,
					lineHeight: 20,
				},
				warning: {
					color: colors.danger,
					fontSize: 14,
					lineHeight: 20,
					fontWeight: "600",
				},
			}),
		[colors],
	);
}
