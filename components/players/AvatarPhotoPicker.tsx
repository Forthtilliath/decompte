import { Ionicons } from "@expo/vector-icons";
import {
	PhotoPicker,
	type PhotoPickerLabels,
	type PhotoPickerStyles,
} from "@forthtilliath/react-native-kit/components/picker/PhotoPicker";
import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { saveAvatarPhoto } from "@/lib/avatarPhotos";

const AVATAR_SIZE = 96;
const BADGE_SIZE = 32;

// Le titre du choix (« Photo du joueur ») et l'ajout viennent des libellés français de la lib.
const LABELS: PhotoPickerLabels = {
	editAccessibilityLabel: () => "Changer la photo du joueur",
};

type Props = {
	name: string;
	seed?: string;
	avatarUri?: string;
	onChange: (avatarUri: string | undefined) => void;
};

/**
 * Avatar du formulaire joueur, cliquable : photo prise avec l'appareil ou choisie dans la galerie,
 * recadrée en carré, initiales colorées sinon. `PhotoPicker` de react-native-kit, avec l'avatar
 * rond et sa pastille appareil photo à la place de l'aperçu carré.
 */
export function AvatarPhotoPicker({ name, seed, avatarUri, onChange }: Props) {
	const colors = useColors();
	const { styles, pickerStyles } = useStyles(colors);

	return (
		<View style={styles.container}>
			<PhotoPicker
				photoUri={avatarUri ?? null}
				onChange={(uri) => onChange(uri ?? undefined)}
				savePhoto={saveAvatarPhoto}
				photoLabel="du joueur"
				labels={LABELS}
				styles={pickerStyles}
				renderPreview={(uri, saving) => (
					<View style={saving && styles.saving}>
						<PlayerAvatar name={name} avatarUri={uri ?? undefined} seed={seed} size={AVATAR_SIZE} />
						<View style={styles.badge}>
							<Ionicons name="camera" size={18} color={colors.primaryText} />
						</View>
					</View>
				)}
			/>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(() => {
		const styles = StyleSheet.create({
			container: {
				alignItems: "center",
				gap: SPACING.sm,
			},
			saving: {
				opacity: 0.6,
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
		});
		const pickerStyles: PhotoPickerStyles = {
			photoPicker: { marginTop: 0 },
			clearLink: { marginTop: 0, color: colors.primary, fontSize: 14, fontWeight: "600" },
		};
		return { styles, pickerStyles };
	}, [colors]);
}
