import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { TextField } from "@/components/ui/TextField";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { useGameImport } from "@/hooks/useGameImport";
import { MAX_EXPORT_LENGTH } from "@/lib/gameExport";

/** Import d'un jeu partagé par un autre joueur (texte reçu par message, collé ici). */
export default function ImportGameScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const importGame = useGameImport();
	const [text, setText] = useState("");

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
				<Text style={styles.hint}>
					Colle ici le texte reçu quand un autre joueur partage un jeu depuis Décompte. Il est
					vérifié entièrement avant d'être ajouté.
				</Text>
				<TextField
					label="Jeu partagé"
					placeholder='{"format":"decompte-game",…}'
					value={text}
					onChangeText={setText}
					multiline
					// +1 : un collage tronqué serait lu « illisible » au lieu de « trop long ».
					maxLength={MAX_EXPORT_LENGTH + 1}
					autoCapitalize="none"
					autoCorrect={false}
					style={styles.input}
				/>
				<Button
					label="Importer"
					disabled={text.trim().length === 0}
					onPress={() => importGame(text)}
				/>
				<Button
					label="Scanner un QR code"
					variant="secondary"
					onPress={() => router.push("/jeux/scanner")}
				/>
			</ScrollView>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.md,
					padding: SPACING.md,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
				input: {
					minHeight: 160,
					maxHeight: 320,
					textAlignVertical: "top",
					fontSize: 13,
				},
			}),
		[colors],
	);
}
