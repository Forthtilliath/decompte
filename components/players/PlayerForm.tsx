import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { AvatarPhotoPicker } from "@/components/players/AvatarPhotoPicker";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { SPACING } from "@/constants/theme";

type Props = {
	/** Id du joueur en cours de modification, pour que la couleur de son avatar reste la même
	 * qu'ailleurs dans l'app (dérivée de l'id, pas du nom). Absent pour un nouveau joueur : pas
	 * encore d'id, la couleur se base alors sur le nom tapé jusqu'à la création. */
	playerId?: string;
	initialName?: string;
	initialAvatarUri?: string;
	submitLabel: string;
	onSubmit: (values: { name: string; avatarUri?: string }) => void;
};

export function PlayerForm({
	playerId,
	initialName = "",
	initialAvatarUri,
	submitLabel,
	onSubmit,
}: Props) {
	const [name, setName] = useState(initialName);
	const [avatarUri, setAvatarUri] = useState(initialAvatarUri);
	const canSubmit = name.trim().length > 0;

	return (
		<View style={styles.container}>
			<AvatarPhotoPicker
				name={name || "?"}
				seed={playerId}
				avatarUri={avatarUri}
				onChange={setAvatarUri}
			/>

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
				onPress={() => onSubmit({ name: name.trim(), avatarUri })}
				style={styles.submit}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		gap: SPACING.lg,
	},
	submit: {
		marginTop: SPACING.md,
	},
});
