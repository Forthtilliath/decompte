import { BooleanScoreField } from "@/components/scoring/BooleanScoreField";
import { ChoiceScoreField } from "@/components/scoring/ChoiceScoreField";
import { ManualPointsFields } from "@/components/scoring/ManualPointsFields";
import { TokenScoreField } from "@/components/scoring/TokenScoreField";
import type { KeyboardChain } from "@/components/ui/NumberStepper";
import type { CategoryDef } from "@/types/game";

type Props = {
	category: CategoryDef;
	/** `undefined` tant que rien n'a été saisi pour ce joueur dans cette catégorie. */
	points: number | undefined;
	onChange: (points: number) => void;
	/** Ignoré par les catégories sans champ texte (choix, oui/non). */
	chain?: KeyboardChain;
};

/** Saisie d'un joueur pour une catégorie, avec le champ propre à son type de calcul. */
export function CategoryScoreField({ category, points, onChange, chain }: Props) {
	const { brick } = category;

	switch (brick.kind) {
		case "manual":
			return (
				<ManualPointsFields
					points={points ?? 0}
					color={category.color}
					allowNegative={brick.allowNegative}
					max={brick.max}
					unitValue={brick.unitValue}
					label={category.label}
					onChange={onChange}
					chain={chain}
				/>
			);
		case "tokens":
			return (
				<TokenScoreField
					points={points ?? 0}
					color={category.color}
					label={category.label}
					tokens={brick.tokens}
					onChange={onChange}
					chain={chain}
				/>
			);
		// Pas de `?? 0` pour les choix : un score absent ne doit pré-cocher aucune option, même
		// celle qui vaut 0 (ex. "Non = 0"), sinon on ne distingue plus "pas encore répondu".
		case "choice":
			return <ChoiceScoreField points={points} options={brick.options} onChange={onChange} />;
		case "boolean":
			return (
				<BooleanScoreField
					points={points}
					yesValue={brick.yesValue}
					noValue={brick.noValue}
					onChange={onChange}
				/>
			);
		// Saisie d'un nombre et non de points : voir ProductScoreField, choisi par l'écran de saisie.
		case "product":
			return null;
	}
}
