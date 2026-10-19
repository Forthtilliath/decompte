import {
	deleteFileQuietly,
	pruneAppDirectory,
} from "@forthtilliath/react-native-kit/utils/files/appFiles";
import { saveImageThumbnail } from "@forthtilliath/react-native-kit/utils/files/imageThumbnail";
import type { Player } from "@/types/player";

// Dossier privé de l'app (documents) : la photo prise ou choisie arrive dans un cache que le
// système peut vider à tout moment, elle doit donc y être copiée pour durer.
const AVATAR_DIRECTORY = "avatars";

/**
 * Réduit la photo choisie en miniature JPEG (largeur 256 px, assez pour un avatar de 96) et la
 * garde dans le dossier des avatars ; renvoie l'URI à enregistrer sur le joueur. Le réencodage
 * retire au passage les métadonnées EXIF (position GPS, appareil…).
 */
export function saveAvatarPhoto(sourceUri: string): Promise<string> {
	return saveImageThumbnail(sourceUri, { directory: AVATAR_DIRECTORY, prefix: "avatar" });
}

/** Supprime la photo d'un joueur (remplacée, retirée, joueur supprimé), sans jamais échouer. */
export function deleteAvatarPhoto(uri: string | undefined): void {
	deleteFileQuietly(uri);
}

/**
 * Supprime les photos qu'aucun joueur n'utilise plus : choisies puis abandonnées (formulaire
 * quitté sans enregistrer), ou laissées par une suppression interrompue. Au mieux : un fichier
 * resté sur le disque ne gêne rien, il partira au prochain lancement.
 */
export function pruneAvatarPhotos(players: Player[]): void {
	try {
		pruneAppDirectory(
			AVATAR_DIRECTORY,
			players.flatMap((p) => (p.avatarUri ? [p.avatarUri] : [])),
		);
	} catch {
		// Dossier illisible : on réessaiera au prochain lancement.
	}
}
