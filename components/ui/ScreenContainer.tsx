import type { PropsWithChildren } from "react";
import { useMemo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { type Edge, SafeAreaView } from "react-native-safe-area-context";
import type { ThemeColors } from "@/constants/theme";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = PropsWithChildren<
	ViewProps & {
		scroll?: boolean;
		padded?: boolean;
		edges?: Edge[];
	}
>;

// Pas de bord "bottom" par défaut : la quasi-totalité des écrans vivent sous la barre d'onglets,
// qui réserve déjà elle-même la zone sûre du bas. En rajouter un ici doublerait cet espace. Les
// rares écrans hors barre d'onglets (modales, détail plein écran) passent edges=["bottom", ...]
// explicitement.
const DEFAULT_EDGES: Edge[] = ["left", "right"];

/** Conteneur d'écran standard : fond de thème + zone sûre + padding par défaut. */
export function ScreenContainer({
	children,
	style,
	padded = true,
	edges = DEFAULT_EDGES,
	...rest
}: Props) {
	const colors = useColors();
	const styles = useStyles(colors);

	return (
		<SafeAreaView style={styles.root} edges={edges}>
			<View style={[styles.container, padded && styles.padded, style]} {...rest}>
				{children}
			</View>
		</SafeAreaView>
	);
}

function useStyles(colors: ThemeColors) {
	return useMemo(
		() =>
			StyleSheet.create({
				root: {
					flex: 1,
					backgroundColor: colors.background,
				},
				container: {
					flex: 1,
				},
				padded: {
					padding: SPACING.md,
				},
			}),
		[colors],
	);
}
