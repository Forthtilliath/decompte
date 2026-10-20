import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { buildQrMatrix, qrPath, toAsciiJson } from "@/lib/qrCode";

/** Marge blanche autour du code, en modules : la norme en demande 4 pour une lecture fiable. */
const QUIET_ZONE = 4;

type Props = {
	visible: boolean;
	onClose: () => void;
	/** Texte du jeu partagé (lib/gameExport : `serializeGame`). */
	text: string;
};

/** QR code d'un jeu, à scanner depuis l'écran d'import d'un autre téléphone. */
export function GameQrSheet({ visible, onClose, text }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const matrix = useMemo(
		() => (visible ? buildQrMatrix(toAsciiJson(text)) : null),
		[visible, text],
	);
	const size = matrix ? matrix.length + QUIET_ZONE * 2 : 0;

	return (
		<BottomSheet visible={visible} onClose={onClose} title="QR code du jeu">
			{matrix ? (
				<View style={styles.content}>
					{/* Toujours noir sur blanc, même en thème sombre : sinon les lecteurs échouent. */}
					<Svg
						viewBox={`0 0 ${size} ${size}`}
						style={styles.code}
						accessibilityLabel="QR code du jeu"
					>
						<Rect width={size} height={size} fill="#ffffff" />
						<Path d={qrPath(matrix, QUIET_ZONE)} fill="#000000" />
					</Svg>
					<Text style={styles.hint}>
						Sur l'autre téléphone : Jeux › Importer un jeu partagé › Scanner un QR code.
					</Text>
				</View>
			) : (
				<Text style={styles.hint}>
					Ce jeu est trop grand pour tenir dans un QR code. Partage-le plutôt en texte.
				</Text>
			)}
		</BottomSheet>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					alignItems: "center",
					gap: SPACING.md,
				},
				code: {
					width: "100%",
					maxWidth: 320,
					aspectRatio: 1,
					borderRadius: RADIUS.sm,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
					textAlign: "center",
				},
			}),
		[colors],
	);
}
