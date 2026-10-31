import {
	type ButtonColors,
	type ButtonProps,
	type ButtonVariant,
	Button as KitButton,
} from "@forthtilliath/react-native-kit/components/form/Button";
import { tapFeedback } from "@forthtilliath/react-native-kit/utils/helpers/haptics";
import type { StyleProp, ViewStyle } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { displayFont, RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

/** `success` (vert) : actions qui font avancer une partie (lancer, reprendre, terminer). */
type Variant = "primary" | "secondary" | "success" | "danger" | "ghost";

type Props = {
	label: string;
	onPress?: () => void;
	variant?: Variant;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
	/** Libellé lu par le lecteur d'écran, si différent du texte affiché. */
	accessibilityLabel?: string;
};

/** Variante du kit qui porte chacune de celles de l'app (`success` = principal en vert). */
const KIT_VARIANT: Record<Variant, ButtonVariant> = {
	primary: "primary",
	success: "primary",
	secondary: "secondary",
	ghost: "secondary",
	danger: "danger",
};

/** Couleurs du kit pour une variante : les fonds neutres gardent un texte lisible en thème clair. */
function kitColors(variant: Variant, colors: ThemeColors): ButtonColors {
	const ghost = variant === "ghost";
	const neutral = ghost ? "transparent" : colors.surfaceAlt;
	return {
		primary: variant === "success" ? colors.success : colors.primary,
		onPrimary: colors.primaryText,
		secondary: neutral,
		onSecondary: colors.text,
		// Seul le bouton discret a un contour : ailleurs, il se confond avec le fond.
		border: ghost ? colors.border : neutral,
		danger: colors.danger,
		onDanger: colors.primaryText,
	};
}

/** Props du `Button` du kit qui l'habillent aux couleurs, au relief et à la police du thème. */
export function kitButtonTheme(
	variant: Variant,
	colors: ThemeColors,
	style?: StyleProp<ViewStyle>,
): Pick<ButtonProps, "variant" | "colors" | "styles"> {
	return {
		variant: KIT_VARIANT[variant],
		colors: kitColors(variant, colors),
		styles: {
			button: [
				{ borderRadius: RADIUS.md, paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
				colors.decor.raised,
				style,
			],
			pressed: colors.decor.raisedPressed,
			label: [{ fontWeight: "600" }, displayFont(colors)],
		},
	};
}

/** `Button` de react-native-kit aux couleurs, au relief et à la police du thème, avec vibration. */
export function Button({
	label,
	onPress,
	variant = "primary",
	disabled,
	style,
	accessibilityLabel,
}: Props) {
	const colors = useColors();

	return (
		<KitButton
			label={label}
			onPress={() => {
				tapFeedback();
				onPress?.();
			}}
			disabled={disabled}
			accessibilityLabel={accessibilityLabel}
			{...kitButtonTheme(variant, colors, style)}
		/>
	);
}
