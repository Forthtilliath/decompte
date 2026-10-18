import { useLocalSearchParams, useRouter } from "expo-router";
import { GameBuilderForm } from "@/components/games/GameBuilderForm";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { toCategoryDefs } from "@/lib/gameDraft";
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
				onSubmit={(values) => {
					// Les catégories existantes gardent leur id pour que l'historique reste résolvable.
					updateGame(game.id, { ...values, categories: toCategoryDefs(values.categories) });
					router.back();
				}}
			/>
		</ScreenContainer>
	);
}
