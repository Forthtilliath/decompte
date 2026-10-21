import type { GameTemplate } from "@/constants/gameTemplates";
import { manual, perUnit } from "@/constants/templateBricks";

/** Modèles des jeux experts : décomptes longs, chacun avec sa propre façon de compter. */
export const EXPERT_GAME_TEMPLATES: GameTemplate[] = [
	{
		id: "terraforming-mars",
		summary: "Récompenses en jetons, objectifs à 5 points, cartes en négatif",
		game: {
			name: "Terraforming Mars",
			minPlayers: 1,
			maxPlayers: 5,
			categories: [
				manual("Niveau de terraformation"),
				{
					label: "Récompenses",
					brick: {
						kind: "tokens",
						tokens: [
							{ label: "1re place", value: 5 },
							{ label: "2e place", value: 2 },
						],
					},
				},
				perUnit("Objectifs", 5),
				manual("Forêts"),
				manual("Villes (forêts adjacentes)"),
				manual("Cartes", true),
			],
		},
	},
	{
		id: "7-wonders-duel",
		summary: "Militaire en paliers, égalité départagée par les bâtiments civils",
		game: {
			name: "7 Wonders Duel",
			minPlayers: 2,
			maxPlayers: 2,
			categories: [
				manual("Bâtiments civils"),
				manual("Bâtiments scientifiques"),
				manual("Bâtiments commerciaux"),
				manual("Guildes"),
				manual("Merveilles"),
				manual("Jetons Progrès"),
				manual("Trésor (1 par 3 pièces)"),
				{
					label: "Militaire",
					brick: {
						kind: "choice",
						options: [
							{ label: "Pion au centre ou chez moi", value: 0 },
							{ label: "1re zone adverse", value: 2 },
							{ label: "2e zone adverse", value: 5 },
							{ label: "3e zone adverse", value: 10 },
						],
					},
				},
			],
			tieBreaker: 0,
		},
	},
	{
		id: "five-tribes",
		summary: "Points par élément, lots de marchandises en jetons",
		game: {
			name: "Five Tribes",
			minPlayers: 2,
			maxPlayers: 4,
			categories: [
				manual("Pièces d'or"),
				manual("Vizirs"),
				perUnit("Adversaires ayant moins de vizirs", 10),
				perUnit("Sages", 2),
				manual("Djinns"),
				manual("Tuiles possédées"),
				perUnit("Palmiers", 3),
				perUnit("Palais", 5),
				{
					label: "Marchandises",
					brick: {
						kind: "tokens",
						tokens: [
							{ label: "Lot de 1 sorte", value: 1 },
							{ label: "Lot de 2 sortes", value: 3 },
							{ label: "Lot de 3 sortes", value: 7 },
							{ label: "Lot de 4 sortes", value: 13 },
							{ label: "Lot de 5 sortes", value: 18 },
							{ label: "Lot de 6 sortes", value: 30 },
							{ label: "Lot de 7 sortes", value: 45 },
							{ label: "Lot de 8 sortes", value: 60 },
							{ label: "Lot de 9 sortes", value: 75 },
						],
					},
				},
			],
		},
	},
	{
		id: "its-a-wonderful-world",
		summary: "Points fixes des cartes puis bonus par type et par jeton",
		game: {
			name: "It's a Wonderful World",
			minPlayers: 1,
			maxPlayers: 5,
			categories: [
				manual("Cartes (points fixes)"),
				manual("Bonus par type de carte"),
				manual("Bonus des Financiers"),
				manual("Bonus des Généraux"),
			],
		},
	},
	{
		id: "dominion",
		summary: "Cartes Victoire en jetons, Malédictions à −1",
		game: {
			name: "Dominion",
			minPlayers: 2,
			maxPlayers: 4,
			categories: [
				{
					label: "Cartes Victoire",
					brick: {
						kind: "tokens",
						tokens: [
							{ label: "Domaine", value: 1 },
							{ label: "Duché", value: 3 },
							{ label: "Province", value: 6 },
							{ label: "Malédiction", value: -1 },
						],
					},
				},
				manual("Autres points (Jardins, jetons…)", true),
			],
		},
	},
	{
		id: "alhambra",
		summary: "3 décomptes de majorités, un par manche",
		game: {
			name: "Alhambra",
			minPlayers: 2,
			maxPlayers: 6,
			rounds: 3,
			categories: [
				manual("Pavillons"),
				manual("Sérails"),
				manual("Arcades"),
				manual("Chambres"),
				manual("Jardins"),
				manual("Tours"),
				manual("Plus long mur"),
			],
		},
	},
];
