import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert } from "react-native";

type Options = {
	/** Titre de l'alerte qui propose l'appareil photo ou la galerie. */
	title: string;
	pickerOptions: ImagePicker.ImagePickerOptions;
	/** Copie la photo choisie là où elle doit durer et renvoie son URI. */
	save: (sourceUri: string) => Promise<string>;
	onSaved: (uri: string) => void;
};

/**
 * Photo prise avec l'appareil (permission demandée au premier usage) ou choisie dans le sélecteur
 * du système (aucune permission de stockage), puis enregistrée. `choose` ouvre le choix.
 */
export function usePhotoChoice({ title, pickerOptions, save, onSaved }: Options) {
	const [isSaving, setIsSaving] = useState(false);

	const keepPhoto = async (result: ImagePicker.ImagePickerResult) => {
		const asset = result.canceled ? undefined : result.assets[0];
		if (!asset) return;
		setIsSaving(true);
		try {
			onSaved(await save(asset.uri));
		} catch {
			Alert.alert("Photo non enregistrée", "La photo n'a pas pu être enregistrée. Réessaie.");
		} finally {
			setIsSaving(false);
		}
	};

	const takePhoto = async () => {
		const permission = await ImagePicker.requestCameraPermissionsAsync();
		if (!permission.granted) {
			Alert.alert(
				"Accès à l'appareil photo refusé",
				"Autorise l'accès dans les réglages du téléphone pour prendre une photo.",
			);
			return;
		}
		await keepPhoto(await ImagePicker.launchCameraAsync(pickerOptions));
	};

	const chooseFromLibrary = async () => {
		await keepPhoto(await ImagePicker.launchImageLibraryAsync(pickerOptions));
	};

	// Trois boutons au plus : Android n'en affiche pas davantage dans une alerte.
	const choose = () => {
		tapFeedback();
		Alert.alert(title, undefined, [
			{ text: "Prendre une photo", onPress: () => void takePhoto() },
			{ text: "Choisir dans la galerie", onPress: () => void chooseFromLibrary() },
			{ text: "Annuler", style: "cancel" },
		]);
	};

	return { choose, isSaving };
}
