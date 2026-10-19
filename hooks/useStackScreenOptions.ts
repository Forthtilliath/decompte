import { useMemo } from "react";
import { useColors } from "@/hooks/useColors";

/** En-têtes et fond aux couleurs du thème, communs au Stack racine et aux Stacks des onglets. */
export function useStackScreenOptions() {
	const colors = useColors();
	return useMemo(
		() => ({
			headerStyle: { backgroundColor: colors.surface },
			headerTintColor: colors.text,
			headerTitleStyle: { color: colors.text },
			contentStyle: { backgroundColor: colors.background },
		}),
		[colors],
	);
}
