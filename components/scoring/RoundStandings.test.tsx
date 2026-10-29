import { render, screen } from "@testing-library/react-native";
import { RoundStandings } from "@/components/scoring/RoundStandings";

describe("RoundStandings", () => {
	it("donne le classement de chaque manche et les places gagnées ou perdues", async () => {
		await render(
			<RoundStandings
				standings={[
					[
						{ id: "a", name: "Alice", rank: 1, total: 4, roundPoints: 4 },
						{ id: "b", name: "Bob", rank: 2, total: 2, roundPoints: 2 },
					],
					[
						{ id: "b", name: "Bob", rank: 1, total: 9, roundPoints: 7 },
						{ id: "a", name: "Alice", rank: 2, total: 5, roundPoints: 1 },
					],
				]}
			/>,
		);
		expect(screen.getByText("Manche 1")).toBeOnTheScreen();
		expect(screen.getByText("Manche 2")).toBeOnTheScreen();
		expect(screen.getByLabelText("1er, Alice, 4 points, +4 cette manche")).toBeOnTheScreen();
		expect(
			screen.getByLabelText("1er, Bob, 9 points, +7 cette manche, gagne 1 place"),
		).toBeOnTheScreen();
		expect(
			screen.getByLabelText("2e, Alice, 5 points, +1 cette manche, perd 1 place"),
		).toBeOnTheScreen();
	});
});
