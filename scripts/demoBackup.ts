import type { BackupData } from "@/lib/backupSchema";
import type { Session, SessionEntry } from "@/types/game";
import type { Player, PlayerGroup } from "@/types/player";
import { buildDemoGames, createRandom, DAY, type DemoGame, NOW } from "./demoGames.ts";

/**
 * Sauvegarde de démonstration (joueurs, jeux et parties fictifs) pour les captures du README :
 * à restaurer sur l'émulateur par Réglages ▸ Sauvegarde ▸ Importer une sauvegarde. Générateur
 * pseudo-aléatoire à graine fixe : le même fichier à chaque exécution.
 */

const HOUR = 3_600_000;
const PLAYER_NAMES = ["Camille", "Lucas", "Inès", "Hugo", "Léa", "Théo", "Manon", "Nathan"];

/** Clé de score d'une manche (lib/rounds) : l'id seul pour la première. */
const scoreKey = (categoryId: string, round: number) =>
	round === 1 ? categoryId : `${categoryId}#${round}`;

export function buildDemoBackup(): BackupData {
	const random = createRandom(42);
	const { int, next, shuffle } = random;
	const games = buildDemoGames(random);

	const players: Player[] = PLAYER_NAMES.map((name, index) => ({
		id: `p${index + 1}`,
		name,
		isFavorite: index < 2,
		isArchived: false,
		createdAt: NOW - 120 * DAY + index * 1000,
	}));
	const group = (id: string, name: string, playerIds: string[], daysAgo: number): PlayerGroup => ({
		id,
		name,
		playerIds,
		isFavorite: id === "g1",
		isArchived: false,
		createdAt: NOW - daysAgo * DAY,
	});
	const groups = [
		group("g1", "Soirée du vendredi", ["p1", "p2", "p3", "p4"], 100),
		group("g2", "Famille", ["p1", "p5", "p6"], 90),
		group("g3", "Club du jeudi", ["p2", "p4", "p7", "p8", "p3"], 80),
	];

	function playRounds(demo: DemoGame, playerIds: string[]): Record<string, SessionEntry> {
		const entries: Record<string, SessionEntry> = Object.fromEntries(
			playerIds.map((id) => [id, { playerId: id, scores: {} }]),
		);
		const totals: Record<string, number> = Object.fromEntries(playerIds.map((id) => [id, 0]));
		const limit = demo.openRounds?.scoreLimit;
		const roundCount = limit === undefined ? (demo.rounds ?? 1) : 12;

		for (let round = 1; round <= roundCount; round++) {
			for (const playerId of playerIds) {
				const entry = entries[playerId];
				for (const [categoryId, value] of Object.entries(demo.score())) {
					const key = scoreKey(categoryId, round);
					const needsCriterion = demo.categories.find(
						(c) => c.id === categoryId,
					)?.requiresValidation;
					// Critère non validé : pas de score, comme dans l'app.
					if (needsCriterion && next() >= 0.6) continue;
					if (needsCriterion) entry.validated = [...(entry.validated ?? []), key];
					entry.scores[key] = value;
					totals[playerId] += value;
				}
			}
			if (limit !== undefined && Object.values(totals).some((total) => total >= limit)) break;
		}
		return entries;
	}

	const plan = shuffle(games.flatMap((demo) => Array<DemoGame>(demo.weight).fill(demo)));
	const allPlayerIds = players.map((p) => p.id);
	const sessions: Session[] = plan.map((demo, index) => {
		const daysAgo = 2 + Math.floor((index * 100) / plan.length) + int(0, 2);
		const createdAt = NOW - daysAgo * DAY - int(0, 5) * HOUR;

		let playerIds: string[];
		let teams: Session["teams"];
		if (demo.teamPlay) {
			playerIds = shuffle(allPlayerIds).slice(0, 6);
			teams = [
				{ id: "ta", name: "Équipe 1", playerIds: playerIds.slice(0, 3) },
				{ id: "tb", name: "Équipe 2", playerIds: playerIds.slice(3) },
			];
		} else {
			const pool = next() < 0.6 ? groups[0].playerIds : allPlayerIds;
			const count = Math.min(demo.maxPlayers, Math.max(demo.minPlayers, int(3, 5)), pool.length);
			playerIds = shuffle(pool).slice(0, count);
		}

		return {
			id: `s${index + 1}`,
			gameDefId: demo.id,
			createdAt,
			finishedAt: createdAt + int(25, 90) * 60_000,
			playerIds,
			entries: playRounds(demo, playerIds),
			...(teams ? { teams } : {}),
			...(demo.lowestWins ? { lowestWins: true } : {}),
			...(demo.tieBreakerId ? { tieBreakerId: demo.tieBreakerId } : {}),
			...(demo.openRounds ? { openRounds: demo.openRounds } : {}),
		};
	});
	sessions.sort((a, b) => b.createdAt - a.createdAt);
	sessions[0].notes = "Extension Leaders. Revanche prévue vendredi prochain !";

	return {
		app: "decompte",
		dataVersion: 1,
		exportedAt: NOW,
		games: games.map(({ score, weight, ...definition }) => definition),
		players,
		groups,
		sessions,
	};
}
