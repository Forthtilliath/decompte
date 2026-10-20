import { pruneAppDirectory } from "@forthtilliath/react-native-kit/utils/files/appFiles";
import { saveImageThumbnail } from "@forthtilliath/react-native-kit/utils/files/imageThumbnail";
import { createPhotoRelinker } from "@/lib/avatarPhotos";
import type { Session } from "@/types/game";

// Dossier privé de l'app, comme les avatars (lib/avatarPhotos) : exclu de la sauvegarde Android
// (`allowBackup: false`) et jamais envoyé dans une sauvegarde fichier ou Google Drive.
const SESSION_PHOTO_DIRECTORY = "parties";

/**
 * Garde la photo de la table d'une partie : réduite (largeur 1280 px, assez pour la revoir en
 * grand sans peser), réencodée en JPEG, ce qui retire les métadonnées EXIF (position GPS…).
 */
export function saveSessionPhoto(sourceUri: string): Promise<string> {
	return saveImageThumbnail(sourceUri, {
		directory: SESSION_PHOTO_DIRECTORY,
		prefix: "partie",
		width: 1280,
		quality: 0.7,
	});
}

/** Photos des parties d'une sauvegarde : seules celles encore dans l'app sont reprises. */
export function relinkSessionPhotos<T extends { photoUri?: string }>(sessions: T[]): T[] {
	const relink = createPhotoRelinker(SESSION_PHOTO_DIRECTORY);
	return sessions.map(({ photoUri, ...session }) => {
		const photo = relink(photoUri);
		return (photo ? { ...session, photoUri: photo } : session) as T;
	});
}

/**
 * Supprime les photos qu'aucune partie n'utilise plus (remplacées, retirées, partie supprimée). Au
 * lancement seulement : une partie supprimée reste « annulable » quelques secondes, sa photo doit
 * survivre jusque-là. Au mieux : un fichier resté sur le disque partira au prochain lancement.
 */
export function pruneSessionPhotos(sessions: Session[]): void {
	try {
		pruneAppDirectory(
			SESSION_PHOTO_DIRECTORY,
			sessions.flatMap((s) => (s.photoUri ? [s.photoUri] : [])),
		);
	} catch {
		// Dossier illisible : on réessaiera au prochain lancement.
	}
}
