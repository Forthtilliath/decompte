import { render, screen } from "@testing-library/react-native";
import { RankedPlayerCard } from "@/components/scoring/RankedPlayerCard";
import { makeCategory, makeEntry, makePlayer } from "@/test/factories";

const categories = [
	makeCategory({ id: "murs", label: "Murs" }),
	makeCategory({ id: "bonus", label: "Bonus" }),
];

describe("RankedPlayerCard", () => {
	it("affiche la médaille, le nom et le total du joueur", async () => {
		await render(
			<RankedPlayerCard
				player={makePlayer({ name: "Alice" })}
				ranked={{ playerId: "p1", total: 18, rank: 1 }}
				entry={makeEntry("p1", { murs: 18 })}
				categories={categories}
			/>,
		);
		expect(screen.getByText("🥇")).toBeOnTheScreen();
		expect(screen.getByText("Alice")).toBeOnTheScreen();
		expect(screen.getByText("18")).toBeOnTheScreen();
	});

	it("affiche le rang en chiffres au-delà du podium", async () => {
		await render(
			<RankedPlayerCard
				player={makePlayer()}
				ranked={{ playerId: "p1", total: 2, rank: 4 }}
				entry={makeEntry("p1")}
				categories={categories}
			/>,
		);
		expect(screen.getByText("#4")).toBeOnTheScreen();
	});

	it("détaille les catégories non nulles uniquement", async () => {
		await render(
			<RankedPlayerCard
				player={makePlayer()}
				ranked={{ playerId: "p1", total: 7, rank: 2 }}
				entry={makeEntry("p1", { murs: 7, bonus: 0 })}
				categories={categories}
			/>,
		);
		expect(screen.getByText("Murs 7")).toBeOnTheScreen();
		expect(screen.queryByText(/Bonus/)).not.toBeOnTheScreen();
	});

	it("garde un joueur supprimé depuis, anonymisé, avec ses points", async () => {
		await render(
			<RankedPlayerCard
				player={undefined}
				ranked={{ playerId: "supprime", total: 25, rank: 1 }}
				entry={makeEntry("supprime", { murs: 25 })}
				categories={categories}
			/>,
		);
		expect(screen.getByText("Joueur supprimé")).toBeOnTheScreen();
		expect(screen.getByText("25")).toBeOnTheScreen();
		expect(screen.getByText("Murs 25")).toBeOnTheScreen();
	});

	it("regroupe les points des catégories retirées du jeu pour que le détail égale le total", async () => {
		await render(
			<RankedPlayerCard
				player={makePlayer()}
				ranked={{ playerId: "p1", total: 9, rank: 1 }}
				entry={makeEntry("p1", { murs: 4, ancienne: 3, autre: 2 })}
				categories={categories}
			/>,
		);
		expect(screen.getByText("Murs 4")).toBeOnTheScreen();
		expect(screen.getByText("Catégories retirées 5")).toBeOnTheScreen();
	});

	it("détaille chaque manche et additionne les manches par catégorie", async () => {
		await render(
			<RankedPlayerCard
				player={makePlayer()}
				ranked={{ playerId: "p1", total: 21, rank: 1 }}
				entry={makeEntry("p1", { murs: 5, "murs#2": 7, bonus: 1, "bonus#3": 8 })}
				categories={categories}
				roundCount={3}
			/>,
		);
		expect(screen.getByText("Manche 1 : 6  ·  Manche 2 : 7  ·  Manche 3 : 8")).toBeOnTheScreen();
		expect(screen.getByText("Murs 12")).toBeOnTheScreen();
		expect(screen.getByText("Bonus 9")).toBeOnTheScreen();
	});

	it("s'annonce d'un bloc au lecteur d'écran : rang, nom, total puis détail", async () => {
		await render(
			<RankedPlayerCard
				player={makePlayer({ name: "Alice" })}
				ranked={{ playerId: "p1", total: 13, rank: 1 }}
				entry={makeEntry("p1", { murs: 5, "murs#2": 7, bonus: 1 })}
				categories={categories}
				roundCount={2}
			/>,
		);
		expect(
			screen.getByLabelText("1er, Alice, 13 points, manche 1 : 6, manche 2 : 7, Murs 12, Bonus 1"),
		).toBeOnTheScreen();
	});

	it("n'affiche pas de détail par manche pour un jeu en une manche", async () => {
		await render(
			<RankedPlayerCard
				player={makePlayer()}
				ranked={{ playerId: "p1", total: 7, rank: 1 }}
				entry={makeEntry("p1", { murs: 7 })}
				categories={categories}
			/>,
		);
		expect(screen.queryByText(/Manche/)).not.toBeOnTheScreen();
	});
});
