import { createBackupManager } from "@forthtilliath/expo-backup";
import { formatFileTimestamp } from "@forthtilliath/ts-kit/files/formatFileTimestamp";
import { createPluralize } from "@forthtilliath/ts-kit/string/pluralize";
import {
	BACKUP_APP_ID,
	BACKUP_DATA_VERSION,
	type BackupData,
	parseBackup,
} from "@/lib/backupSchema";
import { useGamesStore } from "@/stores/gamesStore";
import { useGroupsStore } from "@/stores/groupsStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";

const plural = createPluralize("fr");

export function collectBackupData(): BackupData {
	return {
		app: BACKUP_APP_ID,
		dataVersion: BACKUP_DATA_VERSION,
		exportedAt: Date.now(),
		games: useGamesStore.getState().games,
		players: usePlayersStore.getState().players,
		groups: useGroupsStore.getState().groups,
		sessions: useHistoryStore.getState().sessions,
	};
}

/** Remplace toutes les données sauvegardées (aucune fusion). La partie en cours n'est pas touchée :
 * si son jeu ou ses joueurs disparaissent, les écrans le signalent et proposent de l'abandonner. */
export function replaceAllData(data: BackupData): void {
	useGamesStore.getState().replaceAll(data.games);
	usePlayersStore.getState().replaceAll(data.players);
	useGroupsStore.getState().replaceAll(data.groups);
	useHistoryStore.getState().replaceAll(data.sessions);
}

/** Résumé d'une sauvegarde pour les confirmations (restauration, choix au branchement de Drive). */
export function describeBackup(data: BackupData): string {
	return [
		`${data.games.length} ${plural(data.games.length, "jeu", "jeux")}`,
		`${data.players.length} ${plural(data.players.length, "joueur")}`,
		`${data.sessions.length} ${plural(data.sessions.length, "partie")}`,
	].join(", ");
}

/**
 * Sauvegardes de l'app (`@forthtilliath/expo-backup`) : envoi automatique sur Google Drive après
 * chaque changement une fois le compte relié, export/import d'un fichier avec annulation de la
 * dernière restauration, chiffrement au choix. `appId` nomme les fichiers et la clé de
 * chiffrement : ne jamais le changer.
 */
export const backup = createBackupManager<BackupData>({
	appId: BACKUP_APP_ID,
	encryption: "optional",
	collect: collectBackupData,
	parse: parseBackup,
	apply: replaceAllData,
	isEmpty: (data) => data.games.length === 0 && data.players.length === 0,
	hasLocalData: () =>
		useGamesStore.getState().games.length > 0 || usePlayersStore.getState().players.length > 0,
	maxFileBytes: 5 * 1024 * 1024,
	exportFileName: (date) => `decompte-sauvegarde-${formatFileTimestamp(date)}.json`,
	exportDialogTitle: "Exporter les données Décompte",
});
