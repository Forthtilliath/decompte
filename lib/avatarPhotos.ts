import {
	deleteFileQuietly,
	getAppDirectory,
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

/** Dernier segment d'une URI : le nom du fichier (vide pour un dossier). */
function fileNameOf(uri: string): string {
	return uri.slice(uri.lastIndexOf("/") + 1);
}

/**
 * Photos des joueurs d'une sauvegarde : chaque `avatarUri` est remplacée par la photo du même nom
 * encore présente dans le dossier des avatars (même téléphone), ou retirée sinon. Une URI venue
 * d'un fichier n'est donc jamais chargée telle quelle : seuls les fichiers de l'app sont repris.
 */
export function relinkAvatarPhotos<T extends { avatarUri?: string }>(players: T[]): T[] {
	let photos = new Map<string, string>();
	try {
		photos = new Map(
			getAppDirectory(AVATAR_DIRECTORY)
				.list()
				.map((entry) => [fileNameOf(entry.uri), entry.uri] as const)
				.filter(([name]) => name.length > 0),
		);
	} catch {
		// Dossier illisible : aucune photo n'est reprise.
	}
	return players.map(({ avatarUri, ...player }) => {
		const photo = avatarUri ? photos.get(fileNameOf(avatarUri)) : undefined;
		return (photo ? { ...player, avatarUri: photo } : player) as T;
	});
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
