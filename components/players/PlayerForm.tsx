import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Button } from "@/components/ui/Button";
import { PlayerAvatar } from "@/components/ui/PlayerAvatar";
import { TextField } from "@/components/ui/TextField";
import { SPACING } from "@/constants/theme";

type Props = {
	/** Id du joueur en cours de modification, pour que la couleur de son avatar reste la même
	 * qu'ailleurs dans l'app (dérivée de l'id, pas du nom). Absent pour un nouveau joueur : pas
	 * encore d'id, la couleur se base alors sur le nom tapé jusqu'à la création. */
	playerId?: string;
	initialName?: string;
	submitLabel: string;
	onSubmit: (values: { name: string }) => void;
};

export function PlayerForm({ playerId, initialName = "", submitLabel, onSubmit }: Props) {
	const [name, setName] = useState(initialName);
	const canSubmit = name.trim().length > 0;

	return (
		<View style={styles.container}>
			<View style={styles.avatarPreview}>
				<PlayerAvatar name={name || "?"} seed={playerId} size={96} />
			</View>

			<TextField
				label="Nom du joueur"
				placeholder="Ex : Alex"
				value={name}
				onChangeText={setName}
				autoFocus
			/>

			<Button
				label={submitLabel}
				disabled={!canSubmit}
				onPress={() => onSubmit({ name: name.trim() })}
				style={styles.submit}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: SPACING.lg,
	},
	avatarPreview: {
		alignItems: "center",
	},
	submit: {
		marginTop: SPACING.md,
	},
});
