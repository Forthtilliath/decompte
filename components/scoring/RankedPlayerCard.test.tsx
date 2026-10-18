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
});
