import { Ionicons } from "@expo/vector-icons";
import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { saveAvatarPhoto } from "@/lib/avatarPhotos";

const AVATAR_SIZE = 96;
const BADGE_SIZE = 32;

// Recadrage carré proposé par le système : l'avatar est un cercle, autant choisir ce qu'il montre.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
	mediaTypes: "images",
	allowsEditing: true,
	aspect: [1, 1],
	quality: 0.5,
};

type Props = {
	name: string;
	seed?: string;
	avatarUri?: string;
	onChange: (avatarUri: string | undefined) => void;
};

/**
 * Avatar du formulaire joueur, cliquable : photo prise avec l'appareil ou choisie dans la galerie,
 * initiales colorées sinon. Plutôt que le `PhotoPicker` de react-native-kit, dont l'aperçu carré
 * remplacerait les initiales par un simple « Ajouter une photo ».
 */
export function AvatarPhotoPicker({ name, seed, avatarUri, onChange }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const [isSaving, setIsSaving] = useState(false);

	const keepPhoto = async (result: ImagePicker.ImagePickerResult) => {
		const asset = result.canceled ? undefined : result.assets[0];
		if (!asset) return;
		setIsSaving(true);
		try {
			onChange(await saveAvatarPhoto(asset.uri));
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
		await keepPhoto(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
	};

	// Sélecteur de photos du système : aucune permission de stockage à demander.
	const chooseFromLibrary = async () => {
		await keepPhoto(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
	};

	// Trois boutons au plus : Android n'en affiche pas davantage dans une alerte, d'où « Retirer la
	// photo » à part, sous l'avatar.
	const openChoices = () => {
		tapFeedback();
		Alert.alert("Photo du joueur", undefined, [
			{ text: "Prendre une photo", onPress: () => void takePhoto() },
			{ text: "Choisir dans la galerie", onPress: () => void chooseFromLibrary() },
			{ text: "Annuler", style: "cancel" },
		]);
	};

	return (
		<View style={styles.container}>
			<Pressable
				onPress={openChoices}
				disabled={isSaving}
				accessibilityRole="button"
				accessibilityLabel={
					avatarUri ? "Changer la photo du joueur" : "Ajouter une photo du joueur"
				}
				style={({ pressed }) => pressed && styles.pressed}
			>
				<PlayerAvatar name={name} avatarUri={avatarUri} seed={seed} size={AVATAR_SIZE} />
				<View style={styles.badge}>
					<Ionicons name="camera" size={18} color={colors.primaryText} />
				</View>
			</Pressable>
			{avatarUri ? (
				<Pressable
					onPress={() => onChange(undefined)}
					accessibilityRole="button"
					hitSlop={SPACING.sm}
				>
					<Text style={styles.removeLabel}>Retirer la photo</Text>
				</Pressable>
			) : null}
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				container: {
					alignItems: "center",
					gap: SPACING.sm,
				},
				pressed: {
					opacity: 0.75,
				},
				badge: {
					position: "absolute",
					right: 0,
					bottom: 0,
					width: BADGE_SIZE,
					height: BADGE_SIZE,
					borderRadius: BADGE_SIZE / 2,
					borderWidth: 2,
					borderColor: colors.background,
					backgroundColor: colors.primary,
					alignItems: "center",
					justifyContent: "center",
				},
				removeLabel: {
					color: colors.primary,
					fontSize: 14,
					fontWeight: "600",
				},
			}),
		[colors],
	);
}
