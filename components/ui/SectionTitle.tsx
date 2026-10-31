import { SectionTitle as KitSectionTitle } from "@forthtilliath/react-native-kit/components/layout/SectionTitle";
import type { StyleProp, TextStyle } from "react-native";
import { displayFont } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = { children: string; style?: StyleProp<TextStyle> };

/** Titre de section en petites capitales grisées, comme sur les écrans Joueurs et Jeux. */
export function SectionTitle({ children, style }: Props) {
	const colors = useColors();

	return (
		<KitSectionTitle
			title={children}
			styles={{
				title: [
					{ color: colors.textMuted, fontSize: 14, fontWeight: "400", letterSpacing: 0.5 },
					displayFont(colors),
					style,
				],
			}}
		/>
	);
}
