import { PlayerScoreRow } from "@/components/players/PlayerScoreRow";
import { CategoryScoreField } from "@/components/scoring/CategoryScoreField";
import { ProductScoreField } from "@/components/scoring/ProductScoreField";
import { ValidationCheckbox } from "@/components/scoring/ValidationCheckbox";
import { scoreKey } from "@/lib/rounds";
import { computeEntryTotal } from "@/lib/scoring";
import { useSessionStore } from "@/stores/sessionStore";
import type { CategoryDef, SessionEntry } from "@/types/game";
import type { Player } from "@/types/player";

type Props = {
	player: Player;
	entry: SessionEntry;
	category: CategoryDef;
	/** Toutes les catégories du jeu : un multiplicateur y retrouve celle qu'il multiplie. */
	categories: CategoryDef[];
	round: number;
};

/** Saisie d'un joueur pour une étape : case du critère éventuel, puis le champ de la catégorie. */
export function PlayerCategoryEntry({ player, entry, category, categories, round }: Props) {
	const updateScore = useSessionStore((s) => s.updateScore);
	const updateFactor = useSessionStore((s) => s.updateFactor);
	const setValidated = useSessionStore((s) => s.setValidated);
	const key = scoreKey(category.id, round);
	const { brick } = category;

	// Un score déjà saisi vaut validation : critère ajouté au jeu en cours de partie.
	const validated =
		!category.requiresValidation ||
		entry.validated?.includes(key) ||
		entry.scores[key] !== undefined;

	const field = () => {
		if (brick.kind !== "product") {
			return (
				<CategoryScoreField
					category={category}
					points={entry.scores[key]}
					onChange={(value) => updateScore(player.id, key, value)}
				/>
			);
		}
		const source = categories.find((c) => c.id === brick.sourceId);
		return (
			<ProductScoreField
				factor={entry.factors?.[key]}
				sourcePoints={entry.scores[scoreKey(brick.sourceId, round)] ?? 0}
				sourceLabel={source?.label ?? "catégorie retirée"}
				points={entry.scores[key]}
				color={category.color}
				label={category.label}
				onChange={(factor) => updateFactor(player.id, key, factor)}
			/>
		);
	};

	return (
		<PlayerScoreRow player={player} total={computeEntryTotal(entry)}>
			{category.requiresValidation && (
				<ValidationCheckbox
					checked={validated}
					color={category.color}
					onChange={(checked) => setValidated(player.id, key, checked)}
				/>
			)}
			{validated && field()}
		</PlayerScoreRow>
	);
}
