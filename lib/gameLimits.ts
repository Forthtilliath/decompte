// Bornes d'un jeu, partagées par le formulaire de création/édition et l'import d'un jeu partagé :
// un jeu accepté par l'un doit l'être par l'autre.

export const MAX_GAME_NAME_LENGTH = 60;
export const MAX_LABEL_LENGTH = 40;
export const MAX_CATEGORIES = 30;
/** Jetons d'une catégorie « Jetons » ou valeurs d'une catégorie « Choix ». */
export const MAX_ITEMS = 30;
export const MAX_SCORE = 10_000;
export const MAX_PLAYERS = 50;
export const MAX_ROUNDS = 20;
export const MAX_TEAM_NAME_LENGTH = 30;
/** Total d'une catégorie pour un joueur : des jetons nombreux peuvent dépasser MAX_SCORE. */
export const MAX_SESSION_SCORE = MAX_SCORE * 1000;
/** Nombre saisi dans une catégorie multiplicateur. */
export const MAX_FACTOR = 100;
