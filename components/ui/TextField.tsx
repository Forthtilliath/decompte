import {
	TextField as KitTextField,
	type TextFieldColors,
	type TextFieldProps,
	type TextFieldStyles,
} from "@forthtilliath/react-native-kit/components/form/TextField";
import type { StyleProp, TextStyle } from "react-native";
import type { ThemeColors } from "@/constants/theme";
import { RADIUS, SPACING } from "@/constants/theme";
import { useColors } from "@/hooks/useColors";

type Props = Omit<TextFieldProps, "colors" | "styles"> & {
	/** Style du champ de saisie lui-même. */
	style?: StyleProp<TextStyle>;
};

export function textFieldColors(colors: ThemeColors): TextFieldColors {
	return {
		text: colors.text,
		label: colors.textMuted,
		placeholder: colors.textMuted,
		background: colors.surface,
		border: colors.border,
		borderFocused: colors.primary,
		error: colors.danger,
	};
}

export const TEXT_FIELD_STYLES: TextFieldStyles = {
	label: { fontSize: 14, fontWeight: "400" },
	input: {
		borderRadius: RADIUS.md,
		paddingHorizontal: SPACING.md,
		paddingVertical: SPACING.sm,
	},
};

/** `TextField` de react-native-kit aux couleurs du thème. Sans libellé, le placeholder le nomme. */
export function TextField({ style, accessibilityLabel, ...rest }: Props) {
	const colors = useColors();

	return (
		<KitTextField
			{...rest}
			accessibilityLabel={accessibilityLabel ?? rest.label ?? rest.placeholder}
			colors={textFieldColors(colors)}
			styles={{ ...TEXT_FIELD_STYLES, input: [TEXT_FIELD_STYLES.input, style] }}
		/>
	);
}
