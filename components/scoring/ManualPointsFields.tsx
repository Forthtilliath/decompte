import { StyleSheet, View } from "react-native";
import { NumberStepper } from "@/components/ui/NumberStepper";

type Props = {
	points: number;
	onChange: (points: number) => void;
	color: string;
	allowNegative?: boolean;
	max?: number;
};

export function ManualPointsFields({ points, onChange, color, allowNegative = false, max }: Props) {
	return (
		<View style={styles.row}>
			<NumberStepper
				value={points}
				onChange={onChange}
				min={allowNegative ? undefined : 0}
				max={max}
				accentColor={color}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	row: {
		flexDirection: "row",
		justifyContent: "center",
	},
});
