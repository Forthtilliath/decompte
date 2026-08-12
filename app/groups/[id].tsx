import { useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text } from "react-native";
import { GroupForm } from "@/components/groups/GroupForm";
import { Button } from "@/components/ui/Button";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { SPACING } from "@/constants/theme";
import { useGroupsStore } from "@/stores/groupsStore";

export default function EditGroupScreen() {
	const router = useRouter();
	const { id } = useLocalSearchParams<{ id: string }>();
	const group = useGroupsStore((s) => s.groups.find((g) => g.id === id));
	const updateGroup = useGroupsStore((s) => s.updateGroup);
	const removeGroup = useGroupsStore((s) => s.removeGroup);

	if (!group) {
		return (
			<ScreenContainer edges={["bottom", "left", "right"]}>
				<Text>Groupe introuvable.</Text>
			</ScreenContainer>
		);
	}

	const confirmDelete = () => {
		Alert.alert(
			"Supprimer ce groupe ?",
			`"${group.name}" sera définitivement supprimé. Les joueurs eux-mêmes ne sont pas affectés.`,
			[
				{ text: "Annuler", style: "cancel" },
				{
					text: "Supprimer",
					style: "destructive",
					onPress: () => {
						removeGroup(group.id);
						router.back();
					},
				},
			],
		);
	};

	return (
		<ScreenContainer edges={["bottom", "left", "right"]}>
			<GroupForm
				initialName={group.name}
				initialPlayerIds={group.playerIds}
				submitLabel="Enregistrer"
				onSubmit={({ name, playerIds }) => {
					updateGroup(group.id, { name, playerIds });
					router.back();
				}}
			/>
			<Button
				label="Supprimer le groupe"
				variant="danger"
				onPress={confirmDelete}
				style={styles.deleteButton}
			/>
		</ScreenContainer>
	);
}

const styles = StyleSheet.create({
	deleteButton: {
		marginTop: SPACING.md,
	},
});
