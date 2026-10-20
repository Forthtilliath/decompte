import { CameraView, useCameraPermissions } from "expo-camera";
import { useMemo, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useGameImport } from "@/hooks/useGameImport";
import { MAX_EXPORT_LENGTH } from "@/lib/gameExport";

/**
 * Lecture du QR code d'un jeu affiché sur un autre téléphone (fiche du jeu › Afficher le QR code).
 * Le texte lu passe par le même import vérifié qu'un texte collé : rien n'est ajouté sans
 * confirmation. Caméra seule, sans enregistrement ni micro.
 */
export default function ScanGameScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const [permission, requestPermission] = useCameraPermissions();
	// Un même code est lu plusieurs fois par seconde : un seul import à la fois.
	const busy = useRef(false);
	const importGame = useGameImport(() => {
		busy.current = false;
	});

	if (!permission) return <ScreenContainer />;

	if (!permission.granted) {
		return (
			<ScreenContainer>
				<View style={styles.centered}>
					<Text style={styles.hint}>
						Décompte a besoin de l'appareil photo pour lire le QR code d'un jeu. Rien n'est
						enregistré.
					</Text>
					{permission.canAskAgain ? (
						<Button label="Autoriser l'appareil photo" onPress={requestPermission} />
					) : (
						<Text style={styles.hint}>
							Autorise l'accès dans les réglages du téléphone, ou colle le texte du jeu à la place.
						</Text>
					)}
				</View>
			</ScreenContainer>
		);
	}

	return (
		<ScreenContainer>
			<View style={styles.content}>
				<CameraView
					style={styles.camera}
					facing="back"
					barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
					onBarcodeScanned={({ data }) => {
						if (busy.current) return;
						busy.current = true;
						// Même limite qu'un texte collé, avant toute lecture.
						importGame(data.slice(0, MAX_EXPORT_LENGTH + 1));
					}}
					accessibilityLabel="Aperçu de l'appareil photo"
				/>
				<Text style={styles.hint}>Vise le QR code affiché sur l'autre téléphone.</Text>
			</View>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					flex: 1,
					gap: SPACING.md,
				},
				camera: {
					width: "100%",
					aspectRatio: 1,
					borderRadius: RADIUS.md,
					overflow: "hidden",
				},
				centered: {
					flex: 1,
					justifyContent: "center",
					gap: SPACING.md,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 14,
					textAlign: "center",
				},
			}),
		[colors],
	);
}
