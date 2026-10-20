import { useRouter } from "expo-router";
import { useMemo } from "react";
import { Alert, ScrollView, StyleSheet, Text } from "react-native";
import { SettingsRow } from "@/components/settings/SettingsRow";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { GAME_TEMPLATES, type GameTemplate } from "@/constants/gameTemplates";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { parseGameTemplate } from "@/lib/gameExport";
import { useGamesStore } from "@/stores/gamesStore";

/** Feuilles de score prêtes à l'emploi, ajoutées en un geste puis modifiables comme tout jeu. */
export default function GameTemplatesScreen() {
	const colors = useColors();
	const styles = useStyles(colors);
	const router = useRouter();
	const addGame = useGamesStore((s) => s.addGame);

	const addTemplate = (template: GameTemplate) => {
		const result = parseGameTemplate(template.game);
		if (!result.ok) {
			Alert.alert("Modèle indisponible", result.error);
			return;
		}
		const created = addGame(result.game);
		router.replace(`/jeux/${created.id}`);
	};

	return (
		<ScreenContainer padded={false}>
			<ScrollView contentContainerStyle={styles.content}>
				<Text style={styles.hint}>
					Un modèle ajoute le jeu à ta liste. Vérifie ses catégories avec ta boîte de jeu : tu peux
					le modifier ensuite.
				</Text>
				{GAME_TEMPLATES.map((template) => (
					<SettingsRow
						key={template.id}
						icon="albums-outline"
						label={String(template.game.name)}
						value={template.summary}
						onPress={() => addTemplate(template)}
					/>
				))}
			</ScrollView>
		</ScreenContainer>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				content: {
					gap: SPACING.sm,
					padding: SPACING.md,
				},
				hint: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
