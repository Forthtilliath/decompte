import type { GameTemplate } from "@/constants/gameTemplates";
import { manual, perUnit, yesNo } from "@/constants/templateBricks";

/** Faraway : les régions se décomptent de la dernière posée à la première, chacune seulement si sa
 * condition (merveilles, etc.) est remplie à ce moment-là. */
const farawayRegions = [8, 7, 6, 5, 4, 3, 2, 1].map((n) => ({
	label: `Région ${n}`,
	brick: { kind: "manual", allowNegative: false },
	requiresValidation: true,
}));

/** Modèles des jeux familiaux plus riches : bonus, paliers, conditions et manches libres. */
export const FAMILY_GAME_TEMPLATES: GameTemplate[] = [
	{
		id: "catane",
		summary: "Points par construction, route et armée en Oui / Non",
		game: {
			name: "Catane",
			minPlayers: 3,
			maxPlayers: 4,
			categories: [
				manual("Colonies"),
				perUnit("Villes", 2),
				manual("Cartes Point de victoire"),
				yesNo("Route la plus longue", 2),
				yesNo("Armée la plus puissante", 2),
			],
		},
	},
	{
		id: "citadelles",
		summary: "Bonus 5 couleurs en Oui / Non, cité complète en paliers",
		game: {
			name: "Citadelles",
			minPlayers: 2,
			maxPlayers: 8,
			categories: [
				manual("Coût des quartiers"),
				yesNo("Quartiers des 5 couleurs", 3),
				{
					label: "Cité complète",
					brick: {
						kind: "choice",
						options: [
							{ label: "Non", value: 0 },
							{ label: "Oui", value: 2 },
							{ label: "Oui, la première", value: 4 },
						],
					},
				},
				manual("Bonus des quartiers violets"),
			],
		},
	},
	{
		id: "akropolis",
		summary: "Une catégorie par couleur, égalité départagée par les pierres",
		game: {
			name: "Akropolis",
			minPlayers: 1,
			maxPlayers: 4,
			categories: [
				manual("Habitations"),
				manual("Marchés"),
				manual("Casernes"),
				manual("Temples"),
				manual("Jardins"),
				manual("Pierres"),
			],
			tieBreaker: 5,
		},
	},
	{
		id: "harmonies",
		summary: "Un paysage par catégorie, plus les cartes Animal",
		game: {
			name: "Harmonies",
			minPlayers: 1,
			maxPlayers: 4,
			categories: [
				manual("Arbres"),
				manual("Montagnes"),
				manual("Champs"),
				manual("Bâtiments"),
				manual("Eau"),
				manual("Cartes Animal"),
				manual("Esprit de la nature (variante)"),
			],
		},
	},
	{
		id: "faraway",
		summary: "Chaque région ne compte que si sa condition est remplie",
		game: {
			name: "Faraway",
			minPlayers: 2,
			maxPlayers: 6,
			categories: [...farawayRegions, manual("Sanctuaires")],
		},
	},
	{
		id: "small-world-of-warcraft",
		summary: "Pièces gagnées à chaque tour, manches libres (8 à 10 tours)",
		game: {
			name: "Small World of Warcraft",
			minPlayers: 2,
			maxPlayers: 5,
			openRounds: {},
			categories: [manual("Pièces gagnées")],
		},
	},
];
