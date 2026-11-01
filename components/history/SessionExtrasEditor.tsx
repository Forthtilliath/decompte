import { Image } from "expo-image";
import type * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { usePhotoChoice } from "@/hooks/usePhotoChoice";
import { MAX_NOTES_LENGTH } from "@/lib/gameLimits";
import { saveSessionPhoto } from "@/lib/sessionPhotos";
import type { SessionExtras } from "@/stores/historyStore";

// Photo de la table entière : pas de recadrage imposé.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: "images", quality: 0.7 };

type Props = {
	extras: SessionExtras;
	onChange: (extras: SessionExtras) => void;
	/** Notes enregistrées à chaque lettre plutôt qu'en quittant le champ. Pour la partie en cours :
	 * elle n'est pas sauvegardée, et « Terminer » peut être touché sans quitter le champ. */
	saveNotesWhileTyping?: boolean;
};

/** Notes libres et photo de la table d'une partie, en cours ou de l'historique. */
export function SessionExtrasEditor({ extras, onChange, saveNotesWhileTyping = false }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	// Par défaut, enregistrées en quittant le champ plutôt qu'à chaque lettre (chaque écriture
	// relance l'envoi automatique de la sauvegarde).
	const [notes, setNotes] = useState(extras.notes ?? "");
	const { choose, isSaving } = usePhotoChoice({
		title: "Photo de la partie",
		pickerOptions: PICKER_OPTIONS,
		save: saveSessionPhoto,
		onSaved: (photoUri) => onChange({ ...extras, photoUri }),
	});

	return (
		<View style={styles.container}>
			<SectionTitle>Notes et photo</SectionTitle>
			<TextField
				label="Notes"
				placeholder="Ex. extension utilisée, anecdote…"
				value={notes}
				onChangeText={(text) => {
					setNotes(text);
					if (saveNotesWhileTyping) onChange({ ...extras, notes: text });
				}}
				onBlur={() => {
					if (!saveNotesWhileTyping && notes.trim() !== (extras.notes ?? ""))
						onChange({ ...extras, notes });
				}}
				multiline
				maxLength={MAX_NOTES_LENGTH}
				style={styles.notes}
			/>
			{extras.photoUri && (
				<Image
					source={{ uri: extras.photoUri }}
					style={styles.photo}
					contentFit="cover"
					accessibilityLabel="Photo de la partie"
				/>
			)}
			<Button
				label={extras.photoUri ? "Changer la photo" : "Ajouter une photo de la table"}
				variant="secondary"
				onPress={choose}
				disabled={isSaving}
			/>
			{extras.photoUri && (
				<Button
					label="Retirer la photo"
					variant="ghost"
					onPress={() => onChange({ ...extras, photoUri: undefined })}
				/>
			)}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					gap: SPACING.sm,
				},
				notes: {
					minHeight: 80,
					textAlignVertical: "top",
				},
				photo: {
					width: "100%",
					aspectRatio: 4 / 3,
					borderRadius: RADIUS.md,
					backgroundColor: colors.surfaceAlt,
				},
			}),
		[colors],
	);
}
