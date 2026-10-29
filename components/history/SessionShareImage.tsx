import { type ComponentRef, type RefObject, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { SessionRanking } from "@/components/history/SessionRanking";
import type { ThemeColors } from "@/constants/theme";
import { displayFont, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";
import { formatDate } from "@/lib/date";
import type { SessionRanking as Ranking } from "@/lib/scoring";
import type { GameDef, Session } from "@/types/game";
import type { Player } from "@/types/player";

/** Largeur fixe de l'image : la même quel que soit l'écran, lisible une fois réduite. */
const IMAGE_WIDTH = 400;

type Props = {
	session: Session;
	game: GameDef | undefined;
	ranking: Ranking;
	players: Player[];
	playersById: ReadonlyMap<string, Player>;
	imageRef: RefObject<ComponentRef<typeof View> | null>;
};

/**
 * Image partageable d'une partie passée (nom du jeu, date, classement), rendue hors de l'écran
 * pour être capturée. Large marge sur fond plein tout autour : le contenu ne touche pas les bords
 * une fois l'image affichée dans une messagerie.
 */
export function SessionShareImage({ imageRef, ...rankingProps }: Props) {
	const colors = useColors();
	const styles = useStyles(colors);
	const { session, game } = rankingProps;

	return (
		<View
			style={styles.offscreen}
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			<View ref={imageRef} collapsable={false} style={styles.frame} testID="session-share-image">
				<View>
					<Text style={styles.title}>{game?.name ?? "Partie"}</Text>
					<Text style={styles.date}>{formatDate(session.createdAt)}</Text>
				</View>
				<SessionRanking {...rankingProps} />
			</View>
		</View>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				// Hors de l'écran mais bien rendue : la capture dessine la vue elle-même, où qu'elle soit.
				offscreen: {
					position: "absolute",
					top: 0,
					left: -10000,
				},
				// Fond explicite : sans lui, l'image partagée serait un PNG transparent.
				frame: {
					width: IMAGE_WIDTH,
					backgroundColor: colors.background,
					padding: SPACING.xl,
					gap: SPACING.sm,
				},
				title: {
					color: colors.text,
					fontSize: 22,
					fontWeight: "800",
					...displayFont(colors),
				},
				date: {
					color: colors.textMuted,
					fontSize: 13,
				},
			}),
		[colors],
	);
}
