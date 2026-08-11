import { useLocalSearchParams, useRouter } from "expo-router";
import { GameBuilderForm } from "@/components/games/GameBuilderForm";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { AVATAR_PALETTE } from "@/lib/avatarColor";
import { createId } from "@/lib/uuid";
import { useGamesStore } from "@/stores/gamesStore";

export default function EditGameScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const game = useGamesStore((s) => s.games.find((g) => g.id === id));
	const updateGame = useGamesStore((s) => s.updateGame);

	if (!game) return null;

	return (
		<ScreenContainer>
			<GameBuilderForm
				initial={game}
				submitLabel="Enregistrer"
				onSubmit={({ name, categories, minPlayers, maxPlayers }) => {
					updateGame(game.id, {
						name,
						minPlayers,
						maxPlayers,
						// Les catégories déjà existantes gardent leur id (voir CategoryDef) pour que
						// l'historique déjà enregistré reste résolvable ; les nouvelles en reçoivent un.
						categories: categories.map((c, index) => ({
							id: c.id ?? createId(),
							label: c.label,
							brick: c.brick,
							color: AVATAR_PALETTE[index % AVATAR_PALETTE.length],
						})),
					});
					router.back();
				}}
			/>
		</ScreenContainer>
	);
}
