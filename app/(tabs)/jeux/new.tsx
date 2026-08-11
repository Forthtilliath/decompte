import { useRouter } from "expo-router";
import { GameBuilderForm } from "@/components/games/GameBuilderForm";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { AVATAR_PALETTE } from "@/lib/avatarColor";
import { useGamesStore } from "@/stores/gamesStore";

export default function NewGameScreen() {
	const router = useRouter();
	const addGame = useGamesStore((s) => s.addGame);

	return (
		<ScreenContainer>
			<GameBuilderForm
				submitLabel="Créer le jeu"
				onSubmit={({ name, categories, minPlayers, maxPlayers }) => {
					addGame({
						name,
						minPlayers,
						maxPlayers,
						// Couleur assignée automatiquement par position (pas de sélecteur en V1) : même
						// principe déterministe que les avatars joueurs.
						categories: categories.map((c, index) => ({
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
