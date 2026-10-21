import AsyncStorage from "@react-native-async-storage/async-storage";
import { z } from "zod";
import { gameSchema, idSchema, playerSchema, sessionSchema } from "@/lib/backupSchema";
import { importBrick } from "@/lib/gameExport";
import type { WidgetData } from "@/lib/widgetSummary";

/**
 * Données du widget lues directement dans AsyncStorage : quand Android met le widget à jour, l'app
 * peut être fermée, et ses stores pas encore relus. Mêmes schémas que les stores ; une donnée
 * illisible compte comme absente (le widget n'affiche alors rien de faux).
 */
const persisted = <T extends z.ZodType>(state: T) => z.object({ state });

const sessionState = persisted(
	z.object({ gameDefId: idSchema.nullable(), playerIds: z.array(idSchema) }),
);
const historyState = persisted(z.object({ sessions: z.array(sessionSchema) }));
const gamesState = persisted(z.object({ games: z.array(gameSchema) }));
const playersState = persisted(z.object({ players: z.array(playerSchema) }));

function read<T extends z.ZodType>(raw: string | null | undefined, schema: T): z.infer<T> | null {
	if (!raw) return null;
	try {
		const parsed = schema.safeParse(JSON.parse(raw));
		return parsed.success ? parsed.data : null;
	} catch {
		return null;
	}
}

export async function readWidgetData(): Promise<WidgetData> {
	const values = new Map(
		await AsyncStorage.multiGet(["session-store", "history-store", "games-store", "players-store"]),
	);
	const session = read(values.get("session-store"), sessionState)?.state;
	const ongoing = session && session.playerIds.length > 0 ? session : null;
	return {
		ongoingGameId: ongoing?.gameDefId ?? null,
		ongoingPlayerCount: ongoing?.playerIds.length ?? 0,
		sessions: read(values.get("history-store"), historyState)?.state.sessions ?? [],
		// Seuls les noms servent au widget ; `importBrick` redonne aux options « Choix » leur id.
		games: (read(values.get("games-store"), gamesState)?.state.games ?? []).map((game) => ({
			...game,
			categories: game.categories.map((c) => ({ ...c, brick: importBrick(c.brick) })),
		})),
		players: read(values.get("players-store"), playersState)?.state.players ?? [],
	};
}
