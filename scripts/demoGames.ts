import type { CategoryDef, GameDef, ScoringBrick } from "@/types/game";

/** Jeux de la sauvegarde de démonstration (scripts/demoBackup), avec de quoi tirer leurs scores. */

export const DAY = 86_400_000;
export const NOW = Date.UTC(2026, 9, 30, 21, 0);

// Copie de AVATAR_PALETTE (lib/avatarColor) : le script tourne sous Node, sans l'alias `@/`.
const PALETTE = [
	"#ef4444",
	"#f97316",
	"#f59e0b",
	"#ca8a04",
	"#84cc16",
	"#22c55e",
	"#10b981",
	"#14b8a6",
	"#06b6d4",
	"#0ea5e9",
	"#3b82f6",
	"#6366f1",
	"#8b5cf6",
	"#a855f7",
	"#d946ef",
	"#ec4899",
	"#f43f5e",
	"#78716c",
];

/** Générateur congruentiel linéaire : assez pour des scores plausibles, et reproductible. */
export function createRandom(seed: number) {
	let state = seed;
	const next = () => {
		state = (state * 1103515245 + 12345) % 2147483648;
		return state / 2147483648;
	};
	const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
	const shuffle = <T>(items: T[]) =>
		items
			.map((item) => ({ item, key: next() }))
			.sort((a, b) => a.key - b.key)
			.map(({ item }) => item);
	return { next, int, shuffle };
}

export type Random = ReturnType<typeof createRandom>;

export type DemoGame = GameDef & {
	/** Points d'un joueur pour une manche, par id de catégorie. */
	score: () => Record<string, number>;
	/** Poids dans le tirage des parties jouées. */
	weight: number;
};

const manual = (allowNegative = false): ScoringBrick => ({ kind: "manual", allowNegative });
const yesNo = (yesValue: number): ScoringBrick => ({ kind: "boolean", yesValue, noValue: 0 });

export function buildDemoGames({ int, next }: Random): DemoGame[] {
	let colorIndex = 0;
	const category = (
		id: string,
		label: string,
		brick: ScoringBrick,
		requiresValidation?: boolean,
	): CategoryDef => ({
		id,
		label,
		color: PALETTE[colorIndex++ % PALETTE.length],
		brick,
		...(requiresValidation ? { requiresValidation } : {}),
	});
	const game = (
		fields: Omit<DemoGame, "createdAt" | "isArchived"> & { daysAgo: number },
	): DemoGame => {
		const { daysAgo, ...rest } = fields;
		return { ...rest, createdAt: NOW - daysAgo * DAY, isArchived: false };
	};

	return [
		game({
			id: "gw",
			name: "7 Wonders",
			minPlayers: 3,
			maxPlayers: 7,
			daysAgo: 110,
			weight: 9,
			tieBreakerId: "w2",
			categories: [
				category("w1", "Militaire", manual(true)),
				category("w2", "Trésor", manual()),
				category("w3", "Merveille", manual()),
				category("w4", "Bâtiments civils", manual()),
				category("w5", "Commerce", manual()),
				category("w6", "Guildes", manual()),
				category("w7", "Sciences", manual()),
			],
			score: () => ({
				w1: int(-4, 18),
				w2: int(2, 9),
				w3: int(5, 20),
				w4: int(6, 28),
				w5: int(0, 12),
				w6: int(0, 14),
				w7: int(0, 35),
			}),
		}),
		game({
			id: "gr",
			name: "Les Aventuriers du Rail",
			minPlayers: 2,
			maxPlayers: 5,
			daysAgo: 105,
			weight: 7,
			tieBreakerId: "r2",
			categories: [
				category("r1", "Routes", manual()),
				category("r2", "Destinations réussies", manual()),
				category("r3", "Destinations ratées", manual(true)),
				category("r4", "Plus long chemin", yesNo(10)),
			],
			score: () => ({
				r1: int(30, 70),
				r2: int(10, 60),
				r3: -int(0, 20),
				r4: next() < 0.3 ? 10 : 0,
			}),
		}),
		game({
			id: "gk",
			name: "Kingdomino",
			minPlayers: 2,
			maxPlayers: 4,
			daysAgo: 95,
			weight: 5,
			categories: [
				category("k1", "Domaines", manual()),
				category("k2", "Empire du milieu", yesNo(10)),
				category("k3", "Harmonie", yesNo(5)),
			],
			score: () => ({ k1: int(20, 60), k2: next() < 0.5 ? 10 : 0, k3: next() < 0.4 ? 5 : 0 }),
		}),
		game({
			id: "gd",
			name: "Dominion",
			minPlayers: 2,
			maxPlayers: 4,
			daysAgo: 70,
			weight: 4,
			categories: [
				category("d1", "Cartes Victoire", {
					kind: "tokens",
					tokens: [
						{ label: "Domaine", value: 1 },
						{ label: "Duché", value: 3 },
						{ label: "Province", value: 6 },
						{ label: "Malédiction", value: -1 },
					],
				}),
				category("d2", "Autres points", manual(true)),
			],
			score: () => ({ d1: int(3, 8) + 3 * int(0, 4) + 6 * int(1, 6) - int(0, 3), d2: int(0, 8) }),
		}),
		game({
			id: "gs",
			name: "Skyjo",
			minPlayers: 2,
			maxPlayers: 8,
			daysAgo: 60,
			weight: 6,
			openRounds: { scoreLimit: 100 },
			lowestWins: true,
			categories: [category("s1", "Points", manual(true))],
			score: () => ({ s1: int(-5, 30) }),
		}),
		game({
			id: "gt",
			name: "Time's Up!",
			minPlayers: 4,
			maxPlayers: 12,
			daysAgo: 50,
			weight: 3,
			rounds: 3,
			teamPlay: true,
			categories: [category("t1", "Cartes devinées", manual())],
			score: () => ({ t1: int(3, 12) }),
		}),
		game({
			id: "gp",
			name: "Pixies",
			minPlayers: 2,
			maxPlayers: 5,
			daysAgo: 40,
			weight: 4,
			rounds: 3,
			categories: [
				category("x1", "Cartes validées", manual()),
				category("x2", "Plus grande zone", manual()),
				category("x3", "Spirales", manual(true), true),
			],
			score: () => ({ x1: int(4, 14), x2: int(2, 8), x3: int(-3, 6) }),
		}),
	];
}
