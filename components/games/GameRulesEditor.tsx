import { Pressable, Switch, Text, View } from "react-native";
import { useBrickEditorStyles } from "@/components/games/bricks/useBrickEditorStyles";
import { RadioGroup } from "@/components/ui/RadioGroup";
import type { DraftCategory, GameDraftOptions } from "@/lib/gameDraft";

type Props = {
	options: GameDraftOptions;
	/** Catégories du formulaire, pour choisir celle qui départage. */
	categories: DraftCategory[];
	onChange: (patch: Partial<GameDraftOptions>) => void;
};

const NO_TIE_BREAKER = "aucun";

/** Règles du jeu : sens du classement, départage des égalités, jeu en équipes. */
export function GameRulesEditor({ options, categories, onChange }: Props) {
	const { colors, styles } = useBrickEditorStyles();
	// Une catégorie sans nom ne se reconnaîtrait pas dans la liste.
	const tieBreakerChoices = categories.filter((c) => c.id && c.label.trim());

	const switchRow = (label: string, value: boolean, onToggle: (next: boolean) => void) => (
		<Pressable style={styles.switchRow} onPress={() => onToggle(!value)}>
			<Switch
				value={value}
				onValueChange={onToggle}
				trackColor={{ false: colors.border, true: colors.primary }}
				accessibilityLabel={label}
			/>
			<Text style={styles.switchLabel}>{label}</Text>
		</Pressable>
	);

	return (
		<View style={styles.fields}>
			{switchRow("Le score le plus bas gagne", options.lowestWins, (lowestWins) =>
				onChange({ lowestWins }),
			)}
			{switchRow("Jeu en équipes", options.teamPlay, (teamPlay) => onChange({ teamPlay }))}
			{options.teamPlay && (
				<Text style={styles.hint}>
					Au lancement, chaque joueur rejoint une équipe : le classement se fait sur le total de
					chaque équipe.
				</Text>
			)}

			<Text style={styles.switchLabel}>En cas d'égalité</Text>
			<RadioGroup
				options={[
					{ value: NO_TIE_BREAKER, label: "Ex æquo" },
					...tieBreakerChoices.map((c) => ({ value: c.id as string, label: c.label.trim() })),
				]}
				value={options.tieBreakerId ?? NO_TIE_BREAKER}
				onChange={(value) =>
					onChange({ tieBreakerId: value === NO_TIE_BREAKER ? undefined : value })
				}
			/>
			{options.tieBreakerId && (
				<Text style={styles.hint}>
					Le plus de points dans cette catégorie départage deux totaux égaux.
				</Text>
			)}
		</View>
	);
}
