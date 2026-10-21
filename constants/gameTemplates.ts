import { EXPERT_GAME_TEMPLATES } from "@/constants/gameTemplatesExpert";
import { FAMILY_GAME_TEMPLATES } from "@/constants/gameTemplatesFamily";
import { manual } from "@/constants/templateBricks";

/**
 * Feuilles de score prêtes à l'emploi, au format d'un jeu partagé (lib/gameExportSchema) : elles
 * passent par le même import vérifié qu'un jeu reçu d'un autre joueur, et un test s'assure qu'elles
 * restent toutes valides. Ce sont des points de départ, modifiables une fois ajoutés.
 */
export type GameTemplate = {
	id: string;
	/** Ce que la feuille montre de l'app, en une ligne. */
	summary: string;
	game: Record<string, unknown>;
};

export const GAME_TEMPLATES: GameTemplate[] = [
	{
		id: "7-wonders",
		summary: "7 catégories, égalité départagée par le trésor",
		game: {
			name: "7 Wonders",
			minPlayers: 3,
			maxPlayers: 7,
			categories: [
				manual("Militaire", true),
				manual("Trésor"),
				manual("Merveille"),
				manual("Bâtiments civils"),
				manual("Commerce"),
				manual("Guildes"),
				manual("Sciences"),
			],
			tieBreaker: 1,
		},
	},
	{
		id: "aventuriers-du-rail",
		summary: "Destinations ratées en négatif, bonus Oui / Non du plus long chemin",
		game: {
			name: "Les Aventuriers du Rail",
			minPlayers: 2,
			maxPlayers: 5,
			categories: [
				manual("Routes"),
				manual("Destinations réussies"),
				manual("Destinations ratées", true),
				{ label: "Plus long chemin", brick: { kind: "boolean", yesValue: 10, noValue: 0 } },
			],
			tieBreaker: 1,
		},
	},
	{
		id: "kingdomino",
		summary: "Domaines puis deux bonus Oui / Non",
		game: {
			name: "Kingdomino",
			minPlayers: 2,
			maxPlayers: 4,
			categories: [
				manual("Domaines"),
				{ label: "Empire du milieu", brick: { kind: "boolean", yesValue: 10, noValue: 0 } },
				{ label: "Harmonie", brick: { kind: "boolean", yesValue: 5, noValue: 0 } },
			],
		},
	},
	{
		id: "times-up",
		summary: "En équipes, 3 manches",
		game: {
			name: "Time's Up!",
			minPlayers: 4,
			maxPlayers: 12,
			rounds: 3,
			teamPlay: true,
			categories: [manual("Cartes devinées")],
		},
	},
	{
		id: "golf",
		summary: "Le plus bas gagne, 9 manches",
		game: {
			name: "Golf (jeu de cartes)",
			minPlayers: 2,
			maxPlayers: 6,
			rounds: 9,
			lowestWins: true,
			categories: [manual("Points", true)],
		},
	},
	{
		id: "odin",
		summary: "Manches jusqu'à 15 points, le plus bas gagne",
		game: {
			name: "Odin",
			minPlayers: 2,
			maxPlayers: 6,
			openRounds: { scoreLimit: 15 },
			lowestWins: true,
			categories: [manual("Cartes en main")],
		},
	},
	{
		id: "skyjo",
		summary: "Manches jusqu'à 100 points, le plus bas gagne",
		game: {
			name: "Skyjo",
			minPlayers: 2,
			maxPlayers: 8,
			openRounds: { scoreLimit: 100 },
			lowestWins: true,
			categories: [manual("Points", true)],
		},
	},
	{
		id: "6-qui-prend",
		summary: "Manches jusqu'à 66 têtes, le plus bas gagne",
		game: {
			name: "6 qui prend !",
			minPlayers: 2,
			maxPlayers: 10,
			openRounds: { scoreLimit: 66 },
			lowestWins: true,
			categories: [manual("Têtes de bœuf")],
		},
	},
	...EXPERT_GAME_TEMPLATES,
	...FAMILY_GAME_TEMPLATES,
];
