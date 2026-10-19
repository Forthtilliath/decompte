import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { IntegerField } from "@/components/ui/IntegerField";
import { TextField } from "@/components/ui/TextField";

type Props = {
	/** Ex. "Jeton 2", "Valeur 1". */
	title: string;
	label: string;
	labelPlaceholder: string;
	value: number;
	valueLabel: string;
	removeLabel: string;
	onChangeLabel: (label: string) => void;
	onChangeValue: (value: number) => void;
	onRemove: () => void;
};

/** Une entrée « libellé + nombre de points » d'un jeton ou d'une valeur de choix. */
export function BrickItemRow({
	title,
	label,
	labelPlaceholder,
	value,
	valueLabel,
	removeLabel,
	onChangeLabel,
	onChangeValue,
	onRemove,
}: Props) {
	const { colors, styles } = useBrickEditorStyles();

	return (
		<View style={styles.itemRow}>
			<Text style={styles.itemIndex}>{title}</Text>
			<View style={styles.itemFields}>
				<View style={styles.itemLabel}>
					<TextField
						label="Libellé"
						placeholder={labelPlaceholder}
						value={label}
						onChangeText={onChangeLabel}
					/>
				</View>
				<View style={styles.itemValue}>
					<IntegerField label={valueLabel} placeholder="0" value={value} onChange={onChangeValue} />
				</View>
				<Pressable
					onPress={onRemove}
					hitSlop={12}
					style={styles.itemRemove}
					accessibilityRole="button"
					accessibilityLabel={removeLabel}
				>
					<Ionicons name="close-circle-outline" size={20} color={colors.textMuted} />
				</Pressable>
			</View>
		</View>
	);
}
