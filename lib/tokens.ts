/** Une dénomination de jeton (valeur en points + libellé affiché). */
export type TokenDenomination = {
	value: number;
	label: string;
};

/** Total de points pour un jeu de dénominations et un nombre de jetons de chacune (même index). */
export function computeTokensTotal(tokens: TokenDenomination[], counts: number[]): number {
	return tokens.reduce((sum, token, index) => sum + token.value * (counts[index] ?? 0), 0);
}
