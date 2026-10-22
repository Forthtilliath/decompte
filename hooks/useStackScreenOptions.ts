import { useMemo } from "react";
import { displayFont, type ThemeColors } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

/** En-tête aux couleurs du thème, commun aux Stacks et à la barre d'onglets. */
export function headerOptions(colors: ThemeColors) {
	const text = colors.decor.header?.text ?? colors.text;
	return {
		headerStyle: { backgroundColor: colors.decor.header?.background ?? colors.surface },
		headerTintColor: text,
		headerTitleStyle: { color: text, ...displayFont(colors) },
	};
}

/** En-têtes et fond aux couleurs du thème, communs au Stack racine et aux Stacks des onglets. */
export function useStackScreenOptions() {
	const colors = useColors();
	return useMemo(
		() => ({ ...headerOptions(colors), contentStyle: { backgroundColor: colors.background } }),
		[colors],
	);
}
