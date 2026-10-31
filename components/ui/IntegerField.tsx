import {
	type IntegerFieldProps,
	IntegerField as KitIntegerField,
} from "@forthtilliath/react-native-kit/components/form/IntegerField";
import type { StyleProp, TextStyle } from "react-native";
import { TEXT_FIELD_STYLES, textFieldColors } from "@/components/ui/TextField";
import { useColors } from "@/hooks/useColors";

type Props = Omit<IntegerFieldProps, "colors" | "styles" | "min" | "max"> & {
	/** @defaultValue true */
	allowNegative?: boolean;
	style?: StyleProp<TextStyle>;
};

/**
 * `IntegerField` de react-native-kit aux couleurs du thème : un négatif se tape normalement, un champ
 * vidé reste vide pendant la saisie, et réaffiche la dernière valeur valide en le quittant.
 */
export function IntegerField({ allowNegative = true, style, accessibilityLabel, ...rest }: Props) {
	const colors = useColors();

	return (
		<KitIntegerField
			{...rest}
			min={allowNegative ? -Infinity : 0}
			accessibilityLabel={accessibilityLabel ?? rest.label ?? rest.placeholder}
			colors={textFieldColors(colors)}
			styles={{ ...TEXT_FIELD_STYLES, input: [TEXT_FIELD_STYLES.input, style] }}
		/>
	);
}
