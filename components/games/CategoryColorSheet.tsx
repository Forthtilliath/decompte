import { Ionicons } from "@expo/vector-icons";
import { selectFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { readableTextOn } from "@forthtilliath/ts-kit/color/contrastRatio";
import { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BottomSheet } from "@/components/ui/BottomSheet";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { AVATAR_PALETTE } from "@/lib/avatarColor";

/** Noms lus par le lecteur d'écran, dans l'ordre de AVATAR_PALETTE. */
const COLOR_NAMES: Record<(typeof AVATAR_PALETTE)[number], string> = {
	"#ef4444": "Rouge",
	"#f97316": "Orange",
	"#f59e0b": "Ambre",
	"#ca8a04": "Jaune",
	"#84cc16": "Citron vert",
	"#22c55e": "Vert",
	"#10b981": "Émeraude",
	"#14b8a6": "Sarcelle",
	"#06b6d4": "Cyan",
	"#0ea5e9": "Bleu ciel",
	"#3b82f6": "Bleu",
	"#6366f1": "Indigo",
	"#8b5cf6": "Violet",
	"#a855f7": "Pourpre",
	"#d946ef": "Fuchsia",
	"#ec4899": "Rose vif",
	"#f43f5e": "Rose rouge",
	"#78716c": "Pierre",
};

/** Nom lisible d'une couleur de catégorie ; une couleur hors palette (sauvegarde) reste générique. */
export function categoryColorName(color: string): string {
	return COLOR_NAMES[color as keyof typeof COLOR_NAMES] ?? "Personnalisée";
}

type Props = {
	visible: boolean;
	value: string;
	onChange: (color: string) => void;
	onClose: () => void;
};

/** Choix de la couleur d'une catégorie parmi la palette, en pastilles. */
export function CategoryColorSheet({ visible, value, onChange, onClose }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<BottomSheet visible={visible} onClose={onClose} title="Couleur de la catégorie">
			<View style={styles.grid} accessibilityRole="radiogroup">
				{AVATAR_PALETTE.map((color) => {
					const selected = color === value;
					return (
						<Pressable
							key={color}
							style={[styles.swatch, { backgroundColor: color }, selected && styles.selected]}
							onPress={() => {
								selectFeedback();
								onChange(color);
								onClose();
							}}
							accessibilityRole="radio"
							accessibilityState={{ selected }}
							accessibilityLabel={COLOR_NAMES[color]}
						>
							{selected && <Ionicons name="checkmark" size={22} color={readableTextOn(color)} />}
						</Pressable>
					);
				})}
			</View>
		</BottomSheet>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				grid: {
					flexDirection: "row",
					flexWrap: "wrap",
					justifyContent: "center",
					gap: SPACING.md,
					paddingVertical: SPACING.sm,
				},
				swatch: {
					width: 44,
					height: 44,
					borderRadius: RADIUS.full,
					alignItems: "center",
					justifyContent: "center",
				},
				selected: {
					borderWidth: 3,
					borderColor: colors.text,
				},
			}),
		[colors],
	);
}
