export type Player = {
	id: string;
	name: string;
	avatarUri?: string;
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: number;
};

/** Groupe de joueurs habituels (ex. "Soirée jeux du jeudi"), pour les sélectionner en un geste
 * plutôt qu'un par un lors de la création d'une partie. */
export type PlayerGroup = {
	id: string;
	name: string;
	playerIds: string[];
	isFavorite: boolean;
	isArchived: boolean;
	createdAt: number;
};
