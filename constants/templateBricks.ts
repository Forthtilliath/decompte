/** Catégories des modèles de jeux (constants/gameTemplates), au format d'un jeu partagé. */

export const manual = (label: string, allowNegative = false) => ({
	label,
	brick: { kind: "manual", allowNegative },
});

/** Un nombre d'éléments valant chacun `unitValue` points (ex. 3 points par palmier). */
export const perUnit = (label: string, unitValue: number) => ({
	label,
	brick: { kind: "manual", allowNegative: false, unitValue },
});

/** Une condition Oui / Non : `yesValue` points si elle est remplie, rien sinon. */
export const yesNo = (label: string, yesValue: number) => ({
	label,
	brick: { kind: "boolean", yesValue, noValue: 0 },
});
