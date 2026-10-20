import { Ionicons } from "@expo/vector-icons";
import type * as ImagePicker from "expo-image-picker";
import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { usePhotoChoice } from "@/hooks/usePhotoChoice";
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
	// « Retirer la photo » à part, sous l'avatar : l'alerte du choix n'a pas de place pour lui.
	const { choose: openChoices, isSaving } = usePhotoChoice({
		title: "Photo du joueur",
		pickerOptions: PICKER_OPTIONS,
		save: saveAvatarPhoto,
		onSaved: onChange,
	});

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
