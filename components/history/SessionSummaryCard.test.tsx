import { fireEvent, render, screen } from "@testing-library/react-native";
import { SessionSummaryCard } from "@/components/history/SessionSummaryCard";
import { makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";

const players = [makePlayer({ id: "p1", name: "Alice" }), makePlayer({ id: "p2", name: "Bob" })];
const session = makeSession({
	createdAt: Date.UTC(2026, 9, 19, 12),
	entries: { p1: makeEntry("p1", { a: 3 }), p2: makeEntry("p2", { a: 10 }) },
});

describe("SessionSummaryCard", () => {
	it("affiche le jeu, la date et les joueurs dans l'ordre du classement", async () => {
		await render(
			<SessionSummaryCard
				session={session}
				game={makeGame({ name: "Azul" })}
				players={players}
				onPress={jest.fn()}
			/>,
		);
		expect(screen.getByText("Azul")).toBeOnTheScreen();
		expect(screen.getByText("19 octobre 2026")).toBeOnTheScreen();
		expect(screen.getByText("🥇 10")).toBeOnTheScreen();
		expect(screen.getByText("🥈 3")).toBeOnTheScreen();
		const names = screen.getAllByText(/^(Alice|Bob)$/).map((n) => n.props.children);
		expect(names).toEqual(["Bob", "Alice"]);
	});

	it("signale un jeu supprimé et peut masquer le nom du jeu", async () => {
		const { rerender } = await render(
			<SessionSummaryCard
				session={session}
				game={undefined}
				players={players}
				onPress={jest.fn()}
			/>,
		);
		expect(screen.getByText("Jeu introuvable")).toBeOnTheScreen();

		await rerender(
			<SessionSummaryCard
				session={session}
				game={makeGame({ name: "Azul" })}
				players={players}
				onPress={jest.fn()}
				showGameName={false}
			/>,
		);
		expect(screen.queryByText("Azul")).not.toBeOnTheScreen();
	});

	it("ouvre le détail de la partie", async () => {
		const onPress = jest.fn();
		await render(
			<SessionSummaryCard
				session={session}
				game={makeGame()}
				players={players}
				onPress={onPress}
			/>,
		);
		await fireEvent.press(
			screen.getByRole("button", { name: "Voir le détail de la partie du 19 octobre 2026" }),
		);
		expect(onPress).toHaveBeenCalled();
	});
});
