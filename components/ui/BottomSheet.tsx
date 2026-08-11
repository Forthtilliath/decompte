import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = PropsWithChildren<{
	visible: boolean;
	onClose: () => void;
	title?: string;
}>;

/** Feuille modale glissant depuis le bas, sans dépendance externe (juste le `Modal` natif). */
export function BottomSheet({ visible, onClose, title, children }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
			<Pressable
				style={styles.backdrop}
				onPress={onClose}
				accessibilityRole="button"
				accessibilityLabel="Fermer"
			/>
			<SafeAreaView style={styles.sheet} edges={["bottom"]} accessibilityViewIsModal>
				<View style={styles.handle} />
				{title && <Text style={styles.title}>{title}</Text>}
				{children}
			</SafeAreaView>
		</Modal>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				backdrop: {
					flex: 1,
					backgroundColor: "rgba(0,0,0,0.6)",
				},
				sheet: {
					position: "absolute",
					left: 0,
					right: 0,
					bottom: 0,
					maxHeight: "75%",
					backgroundColor: colors.surface,
					borderTopLeftRadius: RADIUS.lg,
					borderTopRightRadius: RADIUS.lg,
					padding: SPACING.md,
				},
				handle: {
					alignSelf: "center",
					width: 40,
					height: 4,
					borderRadius: RADIUS.full,
					backgroundColor: colors.border,
					marginBottom: SPACING.sm,
				},
				title: {
					color: colors.text,
					fontSize: 16,
					fontWeight: "700",
					marginBottom: SPACING.sm,
				},
			}),
		[colors],
	);
}
