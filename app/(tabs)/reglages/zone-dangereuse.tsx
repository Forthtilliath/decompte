import { useBackupState } from "@forthtilliath/expo-backup-ui/hooks";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, StyleSheet, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { pruneAvatarPhotos } from "@/lib/avatarPhotos";
import { backup } from "@/lib/backup";
import { pruneSessionPhotos } from "@/lib/sessionPhotos";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";

const CONFIRMATION_WORD = "EFFACER";

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
	pruneSessionPhotos([]);
}

export default function DangerZoneSettingsScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const cloudLinked = useBackupState(backup).cloudAccount != null;
	const [confirmation, setConfirmation] = useState("");
	// Un mot à taper plutôt qu'une boîte de dialogue : un appui machinal ne suffit pas à tout perdre.
	const confirmed = confirmation.trim().toUpperCase() === CONFIRMATION_WORD;

	const clear = () => {
		clearAllData().then(
			() => router.back(),
			() =>
				Alert.alert(
					"Rien n'a été effacé",
					"Google Drive n'a pas pu être déconnecté. Réessaie, ou déconnecte-le depuis Sauvegarde et restauration.",
				),
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
			<TextField
				label={`Tape ${CONFIRMATION_WORD} pour confirmer`}
				value={confirmation}
				onChangeText={setConfirmation}
				autoCapitalize="characters"
				autoCorrect={false}
			/>
			<Button
				label="Effacer toutes les données"
				variant="danger"
				disabled={!confirmed}
				onPress={clear}
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
