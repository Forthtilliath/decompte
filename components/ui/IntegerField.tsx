import { useState } from "react";
import type { TextInputProps } from "react-native";
import { TextField } from "@/components/ui/TextField";
import { parseIntegerInput, sanitizeIntegerInput } from "@/lib/numbers";

type Props = Omit<TextInputProps, "value" | "onChange" | "onChangeText" | "keyboardType"> & {
	label?: string;
	value: number;
	onChange: (value: number) => void;
	/** @defaultValue true */
	allowNegative?: boolean;
};

/**
 * Champ de configuration pour un nombre entier. Une saisie qui n'en est pas encore un (champ
 * vidé, "-" seul avant le chiffre d'un négatif) reste affichée telle quelle au lieu d'être
 * remplacée par 0 ; en quittant le champ, il réaffiche la dernière valeur valide.
 */
export function IntegerField({ value, onChange, allowNegative = true, onBlur, ...rest }: Props) {
	const [draft, setDraft] = useState<string | null>(null);

	return (
		<TextField
			{...rest}
			// "number-pad" n'a pas de touche "-" sur Android.
			keyboardType={allowNegative ? "numeric" : "number-pad"}
			value={draft ?? String(value)}
			onChangeText={(raw) => {
				const cleaned = sanitizeIntegerInput(raw, allowNegative);
				const parsed = parseIntegerInput(cleaned);
				if (parsed === null) {
					setDraft(cleaned);
				} else {
					setDraft(null);
					onChange(parsed);
				}
			}}
			onBlur={(event) => {
				setDraft(null);
				onBlur?.(event);
			}}
		/>
	);
}
