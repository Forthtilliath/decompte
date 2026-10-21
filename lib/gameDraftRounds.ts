import { MAX_ROUNDS, MAX_SCORE } from "@/lib/gameLimits";
import type { OpenRounds } from "@/types/game";

/** Fin de partie : après un nombre fixe de manches, au seuil de points (Odin, Skyjo…), ou quand
 * les joueurs le décident (voir OpenRounds). */
export type RoundMode = "fixed" | "scoreLimit" | "free";

/** Mode de fin de partie d'un jeu enregistré. */
export function getRoundMode(openRounds: OpenRounds | undefined): RoundMode {
	if (!openRounds) return "fixed";
	return openRounds.scoreLimit === undefined ? "free" : "scoreLimit";
}

/** Manches telles que le formulaire de jeu les saisit (nombre et seuil encore en texte). */
export type RoundsDraft = {
	roundMode: RoundMode;
	rounds: string;
	scoreLimit: string;
};

export type RoundsResult =
	| { ok: true; rounds: number; openRounds?: OpenRounds }
	| { ok: false; title: string; message: string };

/** Vérifie les manches du formulaire : un message affichable tel quel à la première anomalie. */
export function validateRoundsDraft({ roundMode, rounds, scoreLimit }: RoundsDraft): RoundsResult {
	if (roundMode === "free") return { ok: true, rounds: 1, openRounds: {} };

	if (roundMode === "scoreLimit") {
		const limit = Number(scoreLimit.trim());
		if (!Number.isInteger(limit) || limit < 1 || limit > MAX_SCORE) {
			return {
				ok: false,
				title: "Seuil invalide",
				message: `Le seuil de fin de partie est un nombre entier entre 1 et ${MAX_SCORE}.`,
			};
		}
		return { ok: true, rounds: 1, openRounds: { scoreLimit: limit } };
	}

	// Champ vide ou nul : une seule manche.
	const count = Math.max(1, Number.parseInt(rounds, 10) || 1);
	if (count > MAX_ROUNDS) {
		return {
			ok: false,
			title: "Trop de manches",
			message: `Un jeu compte ${MAX_ROUNDS} manches maximum.`,
		};
	}
	return { ok: true, rounds: count };
}
