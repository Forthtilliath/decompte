import { moveItem } from "@forthtilliath/ts-kit/array/moveItem";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { idSchema, sessionEntriesSchema, teamsSchema, timestampSchema } from "@/lib/backupSchema";
import { openRoundsSchema } from "@/lib/gameExportSchema";
import { MAX_NOTES_LENGTH, MAX_OPEN_ROUNDS, MAX_PLAYERS } from "@/lib/gameLimits";
import { createStoreMigrate, type MigrationSteps, validatedMerge } from "@/lib/persistedState";
import { applyProducts } from "@/lib/products";
import { createId } from "@/lib/uuid";
import { useGamesStore } from "@/stores/gamesStore";
import { type SessionExtras, useHistoryStore } from "@/stores/historyStore";
import {
	createEmptySessionEntry,
	type OpenRounds,
	type Session,
	type SessionEntry,
	type SessionSetup,
	type Team,
} from "@/types/game";

type State = {
	gameDefId: string | null;
	playerIds: string[];
	entries: Record<string, SessionEntry>;
	startedAt: number | null;
	/** Dernière étape de saisie affichée, pour reprendre la partie là où on l'a laissée. Absente
	 * d'une partie enregistrée avant son ajout : la fusion de `persist` lui donne `null`. */
	currentCategoryId: string | null;
	/** Manche de cette étape, même logique (absente → `null`, lue comme la manche 1). */
	currentRound: number | null;
	/** Règles de classement du jeu au lancement (voir RankingRules) et équipes : absentes d'une
	 * partie lancée avant leur ajout, la fusion de `persist` leur donne les valeurs par défaut. */
	lowestWins: boolean;
	tieBreakerId: string | null;
	teams: Team[] | null;
	/** Manches ouvertes du jeu au lancement (voir OpenRounds), `null` pour un nombre fixe. */
	openRounds: OpenRounds | null;
	/** Manches commencées d'une partie en manches ouvertes, `null` sinon (celles du jeu). */
	roundCount: number | null;
	/** Notes et photo de la table, ajoutées au classement final, reprises dans l'historique. */
	notes: string | null;
	photoUri: string | null;
};

type Actions = {
	/** `teams` : seulement pour un jeu en équipes ; joueurs déjà regroupés par équipe. */
	startNewSession: (gameDefId: string, playerIds: string[], setup?: SessionSetup) => void;
	/** `scoreKey` : l'id de catégorie pour la manche 1, suivi de la manche ensuite (lib/rounds). */
	updateScore: (playerId: string, scoreKey: string, points: number) => void;
	/** Nombre saisi dans une catégorie multiplicateur : ses points en sont recalculés. */
	updateFactor: (playerId: string, scoreKey: string, factor: number) => void;
	/** Coche ou décoche le critère d'une catégorie pour un joueur. Décoché, son score est effacé. */
	setValidated: (playerId: string, scoreKey: string, validated: boolean) => void;
	/** Change l'ordre de jeu : décale le joueur de `offset` places (négatif = vers le haut). */
	movePlayer: (playerId: string, offset: number) => void;
	setCurrentCategory: (categoryId: string, round?: number) => void;
	/** Manches ouvertes : nombre de manches de la partie (une de plus, ou une vide retirée). */
	setRoundCount: (roundCount: number) => void;
	setExtras: (extras: SessionExtras) => void;
	/** Construit l'objet Session correspondant à l'état courant, sans le persister. */
	toSession: () => Session;
	/** Enregistre la partie dans l'historique et réinitialise la partie en cours. */
	finishSession: () => void;
	resetSession: () => void;
	hasOngoingSession: () => boolean;
};

const EMPTY_STATE: State = {
	gameDefId: null,
	playerIds: [],
	entries: {},
	startedAt: null,
	currentCategoryId: null,
	currentRound: null,
	lowestWins: false,
	tieBreakerId: null,
	teams: null,
	openRounds: null,
	roundCount: null,
	notes: null,
	photoUri: null,
};

// À incrémenter à tout changement incompatible de State, en ajoutant son étape à SESSION_MIGRATIONS.
export const SESSION_STORE_VERSION = 1;

/** Mêmes règles qu'une partie d'une sauvegarde importée (lib/backupSchema). Les champs optionnels
 * manquent à une partie enregistrée avant leur ajout (voir State). */
const sessionStateSchema = z.object({
	gameDefId: idSchema.nullable(),
	playerIds: z.array(idSchema).max(MAX_PLAYERS),
	entries: sessionEntriesSchema,
	startedAt: timestampSchema.nullable(),
	currentCategoryId: idSchema.nullable().optional(),
	currentRound: z.number().int().min(1).max(MAX_OPEN_ROUNDS).nullable().optional(),
	lowestWins: z.boolean().optional(),
	tieBreakerId: idSchema.nullable().optional(),
	teams: teamsSchema.nullable().optional(),
	openRounds: openRoundsSchema.nullable().optional(),
	roundCount: z.number().int().min(1).max(MAX_OPEN_ROUNDS).nullable().optional(),
	notes: z.string().max(MAX_NOTES_LENGTH).nullable().optional(),
	photoUri: z.string().max(1024).nullable().optional(),
});

/** Voir MigrationSteps : aucune étape tant que la version 1 est la seule. */
export const SESSION_MIGRATIONS: MigrationSteps = {};

/** Exportée pour être testée isolément, sans instancier tout le store Zustand + AsyncStorage. */
export const migrateSessionStoreData = createStoreMigrate<State>(
	"session-store",
	SESSION_STORE_VERSION,
	SESSION_MIGRATIONS,
	EMPTY_STATE,
);

export const useSessionStore = create<State & Actions>()(
	persist(
		(set, get) => {
			/** Enregistre la feuille d'un joueur, multiplicateurs recalculés (lib/products). */
			const setEntry = (playerId: string, entry: SessionEntry) => {
				const game = useGamesStore.getState().games.find((g) => g.id === get().gameDefId);
				set({
					entries: {
						...get().entries,
						[playerId]: game ? applyProducts(entry, game.categories) : entry,
					},
				});
			};

			return {
				...EMPTY_STATE,

				startNewSession: (gameDefId, playerIds, setup = {}) => {
					set({
						gameDefId,
						playerIds,
						entries: Object.fromEntries(playerIds.map((id) => [id, createEmptySessionEntry(id)])),
						startedAt: Date.now(),
						currentCategoryId: null,
						currentRound: null,
						lowestWins: setup.lowestWins ?? false,
						tieBreakerId: setup.tieBreakerId ?? null,
						teams: setup.teams && setup.teams.length > 0 ? setup.teams : null,
						openRounds: setup.openRounds ?? null,
						roundCount: setup.openRounds ? 1 : null,
						notes: null,
						photoUri: null,
					});
				},

				setCurrentCategory: (categoryId, round = 1) =>
					set({ currentCategoryId: categoryId, currentRound: round }),

				setRoundCount: (roundCount) => {
					if (get().openRounds) set({ roundCount });
				},

				setExtras: ({ notes, photoUri }) =>
					set({ notes: notes ?? null, photoUri: photoUri ?? null }),

				updateScore: (playerId, scoreKey, points) => {
					const current = get().entries[playerId];
					if (!current) return;
					setEntry(playerId, { ...current, scores: { ...current.scores, [scoreKey]: points } });
				},

				updateFactor: (playerId, scoreKey, factor) => {
					const current = get().entries[playerId];
					if (!current) return;
					setEntry(playerId, { ...current, factors: { ...current.factors, [scoreKey]: factor } });
				},

				setValidated: (playerId, scoreKey, validated) => {
					const current = get().entries[playerId];
					if (!current) return;
					const others = (current.validated ?? []).filter((key) => key !== scoreKey);
					if (validated) {
						setEntry(playerId, { ...current, validated: [...others, scoreKey] });
						return;
					}
					const { [scoreKey]: _score, ...scores } = current.scores;
					const { [scoreKey]: _factor, ...factors } = current.factors ?? {};
					setEntry(playerId, {
						...current,
						validated: others,
						scores,
						...(current.factors && { factors }),
					});
				},

				movePlayer: (playerId, offset) => {
					const { playerIds } = get();
					const next = moveItem(playerIds, playerIds.indexOf(playerId), offset);
					if (next !== playerIds) set({ playerIds: next });
				},

				toSession: () => {
					const state = get();
					return {
						id: createId(),
						gameDefId: state.gameDefId ?? "",
						createdAt: state.startedAt ?? Date.now(),
						playerIds: state.playerIds,
						entries: state.entries,
						...(state.lowestWins && { lowestWins: true }),
						...(state.tieBreakerId && { tieBreakerId: state.tieBreakerId }),
						...(state.teams && { teams: state.teams }),
						...(state.openRounds && { openRounds: state.openRounds }),
						// Mêmes règles que updateSessionExtras : vides, ils sont omis.
						...(state.notes?.trim() && { notes: state.notes.trim() }),
						...(state.photoUri && { photoUri: state.photoUri }),
					};
				},

				finishSession: () => {
					const session = get().toSession();
					useHistoryStore.getState().addSession({ ...session, finishedAt: Date.now() });
					set(EMPTY_STATE);
				},

				resetSession: () => set(EMPTY_STATE),

				hasOngoingSession: () => get().playerIds.length > 0,
			};
		},
		{
			name: "session-store",
			storage: createJSONStorage(() => AsyncStorage),
			version: SESSION_STORE_VERSION,
			migrate: migrateSessionStoreData,
			merge: validatedMerge<State>("session-store", SESSION_STORE_VERSION, sessionStateSchema),
		},
	),
);
