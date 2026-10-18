import { describePlayerDeletion, getPlayerUsage } from "@/lib/playerDeletion";
import { makeGroup, makePlayer, makeSession } from "@/test/factories";

const alice = makePlayer({ id: "alice", name: "Alice" });

describe("getPlayerUsage", () => {
	const sessions = [
		makeSession({ id: "s1", playerIds: ["alice", "bob"] }),
		makeSession({ id: "s2", playerIds: ["bob"] }),
		makeSession({ id: "s3", playerIds: ["alice"] }),
	];
	const groups = [
		makeGroup({ id: "g1", playerIds: ["alice"] }),
		makeGroup({ id: "g2", playerIds: ["bob"] }),
	];

	it("compte les parties et groupes où figure le joueur", () => {
		expect(getPlayerUsage("alice", sessions, groups, [])).toEqual({
			sessionCount: 2,
			groupCount: 1,
			inOngoingSession: false,
		});
	});

	it("signale un joueur de la partie en cours", () => {
		expect(getPlayerUsage("alice", [], [], ["bob", "alice"]).inOngoingSession).toBe(true);
	});

	it("ne trouve rien pour un joueur jamais utilisé", () => {
		expect(getPlayerUsage("zoe", sessions, groups, ["bob"])).toEqual({
			sessionCount: 0,
			groupCount: 0,
			inOngoingSession: false,
		});
	});
});

describe("describePlayerDeletion", () => {
	const usage = (sessionCount: number, groupCount: number) => ({
		sessionCount,
		groupCount,
		inOngoingSession: false,
	});

	it("propose l'archivage pour un joueur jamais utilisé", () => {
		expect(describePlayerDeletion(alice, usage(0, 0))).toBe(
			"Alice sera définitivement supprimé. L'archiver le masque des listes sans rien changer d'autre.",
		);
	});

	it("rassure sur l'historique et prévient pour les groupes", () => {
		expect(describePlayerDeletion(alice, usage(3, 2))).toBe(
			"Alice sera définitivement supprimé. Ses scores restent dans 3 parties de l'historique, sous « Joueur supprimé ». Il sera retiré de 2 groupes. L'archiver le masque des listes sans rien changer d'autre.",
		);
	});

	it("accorde au singulier", () => {
		const message = describePlayerDeletion(alice, usage(1, 1));
		expect(message).toContain("dans 1 partie de l'historique");
		expect(message).toContain("retiré de 1 groupe.");
	});

	it("ne propose pas l'archivage d'un joueur déjà archivé", () => {
		const archived = makePlayer({ name: "Alice", isArchived: true });
		expect(describePlayerDeletion(archived, usage(0, 0))).toBe(
			"Alice sera définitivement supprimé.",
		);
	});
});
