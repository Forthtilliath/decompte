import type { CategoryDef, GameDef, Session, SessionEntry } from "@/types/game";
import type { Player, PlayerGroup } from "@/types/player";

// Fabriques de données de test : valeurs par défaut valides, surchargées au cas par cas pour que
// chaque test n'écrive que ce qui compte pour lui.

export function makePlayer(overrides: Partial<Player> = {}): Player {
	return {
		id: "p1",
		name: "Alice",
		isFavorite: false,
		isArchived: false,
		createdAt: 0,
		...overrides,
	};
}

export function makeGroup(overrides: Partial<PlayerGroup> = {}): PlayerGroup {
	return {
		id: "g1",
		name: "Jeudi",
		playerIds: [],
		isFavorite: false,
		isArchived: false,
		createdAt: 0,
		...overrides,
	};
}

export function makeCategory(overrides: Partial<CategoryDef> = {}): CategoryDef {
	return {
		id: "c1",
		label: "Points",
		color: "#ef4444",
		brick: { kind: "manual", allowNegative: false },
		...overrides,
	};
}

export function makeGame(overrides: Partial<GameDef> = {}): GameDef {
	return {
		id: "game1",
		name: "Azul",
		categories: [makeCategory()],
		minPlayers: 2,
		maxPlayers: 4,
		createdAt: 0,
		isArchived: false,
		...overrides,
	};
}

export function makeEntry(playerId: string, scores: Record<string, number> = {}): SessionEntry {
	return { playerId, scores };
}

export function makeSession(overrides: Partial<Session> = {}): Session {
	return {
		id: "s1",
		gameDefId: "game1",
		createdAt: 0,
		playerIds: ["p1", "p2"],
		entries: { p1: makeEntry("p1"), p2: makeEntry("p2") },
		...overrides,
	};
}
