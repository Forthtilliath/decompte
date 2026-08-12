import { useRouter } from "expo-router";
import { GroupForm } from "@/components/groups/GroupForm";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { useGroupsStore } from "@/stores/groupsStore";

export default function NewGroupScreen() {
	const router = useRouter();
	const addGroup = useGroupsStore((s) => s.addGroup);

	return (
		<ScreenContainer edges={["bottom", "left", "right"]}>
			<GroupForm
				submitLabel="Créer le groupe"
				onSubmit={({ name, playerIds }) => {
					addGroup({ name, playerIds });
					router.back();
				}}
			/>
		</ScreenContainer>
	);
}
