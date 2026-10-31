import { Ionicons } from "@expo/vector-icons";
import { EmptyState as KitEmptyState } from "@forthtilliath/react-native-kit/components/feedback/EmptyState";
import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import { kitButtonTheme } from "@/components/ui/Button";
import { SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = {
	icon: keyof typeof Ionicons.glyphMap;
	message: string;
	/** Bouton qui mène directement à ce qui remplira la liste (« Créer un joueur »). */
	action?: { label: string; onPress: () => void };
};

/** Liste vide : une icône, l'explication et, si possible, l'action qui permet d'en sortir. */
export function EmptyState({ icon, message, action }: Props) {
	const colors = useColors();

	return (
		<KitEmptyState
			icon={<Ionicons name={icon} size={36} color={colors.textMuted} />}
			message={message}
			action={
				action && {
					label: action.label,
					onPress: () => {
						tapFeedback();
						action.onPress();
					},
					fullWidth: true,
					...kitButtonTheme("primary", colors),
				}
			}
			styles={{
				container: { gap: SPACING.md, paddingVertical: SPACING.xl, paddingHorizontal: SPACING.md },
				iconWrap: { backgroundColor: colors.surfaceAlt },
				message: { color: colors.textMuted, fontSize: 14, lineHeight: undefined },
			}}
		/>
	);
}
