import { memo } from "react";
import { StyleSheet } from "react-native";
import Svg, { Circle, Defs, G, Path, Pattern, Rect } from "react-native-svg";

type Props = {
	color: string;
	opacity: number;
};

const TILE = 120;

// Silhouettes de 20 × 20 : meeple, pion et hexagone, tracés à la main.
const MEEPLE =
	"M10 1a3 3 0 0 1 3 3c0 1-.4 1.6-.8 2L18 8c1.2.4 1.4 1.8.4 2.4L14 12l2.5 6c.3.8-.2 1-.8 1H12l-2-4-2 4H4.3c-.6 0-1.1-.2-.8-1L6 12l-4.4-1.6c-1-.6-.8-2 .4-2.4L7.8 6C7.4 5.6 7 5 7 4a3 3 0 0 1 3-3Z";
const PAWN = "M10 1.5a3 3 0 1 1 0 6 3 3 0 0 1 0-6ZM7.6 8.5h4.8L14 16H6ZM4.5 16h11v3h-11Z";
const HEXAGON = "M10 1l8 4.6v9.2L10 19.4 2 14.8V5.6Z";

/**
 * Filigrane du thème Ludique : dés, meeples, hexagones et pions répétés en tuile, comme le dos
 * d'un plateau de jeu. Purement décoratif, ignoré par les lecteurs d'écran. Une image répétée
 * (`resizeMode="repeat"`) ne coûterait pas moins : React Native la recompose aussi en une image
 * de la taille de la vue.
 */
export const BoardPattern = memo(function BoardPattern({ color, opacity }: Props) {
	return (
		<Svg
			style={StyleSheet.absoluteFill}
			opacity={opacity}
			pointerEvents="none"
			accessibilityElementsHidden
			importantForAccessibility="no-hide-descendants"
		>
			<Defs>
				<Pattern id="board" patternUnits="userSpaceOnUse" width={TILE} height={TILE}>
					<G stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round">
						<G transform="translate(10 12) rotate(-12 13 13)">
							<Rect width={26} height={26} rx={6} />
							<Circle cx={7.5} cy={7.5} r={2.2} fill={color} />
							<Circle cx={13} cy={13} r={2.2} fill={color} />
							<Circle cx={18.5} cy={18.5} r={2.2} fill={color} />
						</G>
						<Path d={MEEPLE} transform="translate(70 10) rotate(14 10 10) scale(1.4)" />
						<Path d={HEXAGON} transform="translate(14 68) scale(1.3)" />
						<Path d={PAWN} transform="translate(72 66) rotate(-8 10 10) scale(1.5)" />
						<Circle cx={58} cy={58} r={2} fill={color} />
						<Circle cx={112} cy={50} r={2} fill={color} />
						<Circle cx={50} cy={112} r={2} fill={color} />
					</G>
				</Pattern>
			</Defs>
			<Rect width="100%" height="100%" fill="url(#board)" />
		</Svg>
	);
});
