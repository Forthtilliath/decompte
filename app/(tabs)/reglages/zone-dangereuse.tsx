import { useBackupState } from "@forthtilliath/expo-backup-ui/hooks";
import { confirmDestructive } from "@forthtilliath/react-native-kit/utils/helpers/confirmDestructive";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, StyleSheet, Text } from "react-native";
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

/**
 * Google Drive d'abord : sinon l'effacement déclencherait l'envoi automatique d'une copie vide
 * par-dessus la sauvegarde. Déconnecté, Drive garde sa copie ; le reconnecter demande alors quelles
 * données garder. Si la déconnexion échoue, rien n'est effacé.
 */
async function clearAllData() {
	if (backup.getState().cloudAccount) await backup.disconnectCloud();
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
				clearAllData().then(
					() => router.back(),
					() =>
						Alert.alert(
							"Rien n'a été effacé",
							"Google Drive n'a pas pu être déconnecté. Réessaie, ou déconnecte-le depuis Sauvegarde et restauration.",
						),
				);
			},
			{
				message: cloudLinked
					? "Jeux, joueurs, groupes, historique et partie en cours seront supprimés. Google Drive sera déconnecté et gardera sa copie."
					: "Jeux, joueurs, groupes, historique et partie en cours seront supprimés.",
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
					La sauvegarde Google Drive est active : elle sera déconnectée avant l'effacement et sa
					copie restera telle quelle. Pour la récupérer, reconnecte Google Drive et choisis de
					garder ses données.
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
