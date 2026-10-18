import { useRouter } from "expo-router";
import { GameBuilderForm } from "@/components/games/GameBuilderForm";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { toCategoryDefs } from "@/lib/gameDraft";
import { useGamesStore } from "@/stores/gamesStore";

export default function NewGameScreen() {
	const router = useRouter();
	const addGame = useGamesStore((s) => s.addGame);

	return (
		<ScreenContainer>
			<GameBuilderForm
				submitLabel="Créer le jeu"
				onSubmit={(values) => {
					// Couleur assignée par position (`paletteColor`, comme à l'import d'un jeu partagé).
					addGame({ ...values, categories: toCategoryDefs(values.categories) });
					router.back();
				}}
			/>
		</ScreenContainer>
	);
}
