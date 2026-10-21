import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { makeEntry, makeGame, makePlayer, makeSession } from "@/test/factories";
import { WIDGET_NAME } from "@/widget/DecompteWidget";
import { readWidgetData } from "@/widget/readWidgetData";
import { widgetTaskHandler } from "@/widget/widgetTaskHandler";

const persist = (key: string, state: unknown) =>
	AsyncStorage.setItem(key, JSON.stringify({ state, version: 1 }));

beforeEach(async () => {
	await AsyncStorage.clear();
});

function handle(widgetAction: WidgetTaskHandlerProps["widgetAction"], widgetName = WIDGET_NAME) {
	const renderWidget = jest.fn();
	const props = {
		widgetInfo: { widgetName, widgetId: 1, width: 200, height: 120, screenInfo: {} },
		widgetAction,
		renderWidget,
	} as unknown as WidgetTaskHandlerProps;
	return { done: widgetTaskHandler(props), renderWidget };
}

type Element = { type: (props: unknown) => Element; props: Record<string, unknown> };

/** Textes affichés par le widget rendu (thème clair) : le corps du widget, déroulé. */
function texts(rendered: { light: Element }) {
	const body = rendered.light.type(rendered.light.props);
	return (body.props.children as Element[]).map((child) => child.props.text);
}

describe("widget d'écran d'accueil", () => {
	it("lit l'historique enregistré, même app fermée, et montre le dernier vainqueur", async () => {
		await persist("games-store", { games: [makeGame({ id: "azul", name: "Azul" })] });
		await persist("players-store", { players: [makePlayer({ id: "p1", name: "Alice" })] });
		await persist("history-store", {
			sessions: [
				makeSession({
					gameDefId: "azul",
					playerIds: ["p1"],
					entries: { p1: makeEntry("p1", { x: 42 }) },
				}),
			],
		});

		const { done, renderWidget } = handle("WIDGET_UPDATE");
		await done;
		expect(texts(renderWidget.mock.calls[0][0])).toEqual([
			"Dernière partie · Azul",
			"🏆 Alice",
			"42 points · 01 janvier 1970",
		]);
	});

	it("propose de reprendre une partie en cours", async () => {
		await persist("games-store", { games: [makeGame({ id: "azul", name: "Azul" })] });
		await persist("session-store", { gameDefId: "azul", playerIds: ["a", "b"] });
		const { done, renderWidget } = handle("WIDGET_ADDED");
		await done;
		expect(texts(renderWidget.mock.calls[0][0])[1]).toBe("Azul");
	});

	it("ignore les données illisibles plutôt que d'afficher du faux", async () => {
		await AsyncStorage.setItem("history-store", "{pas du json");
		await persist("games-store", { games: [{ id: 3 }] });
		expect(await readWidgetData()).toMatchObject({ sessions: [], games: [] });
	});

	it("ne redessine rien pour un appui ou un autre widget", async () => {
		for (const [action, name] of [
			["WIDGET_CLICK", WIDGET_NAME],
			["WIDGET_UPDATE", "Autre"],
		] as const) {
			const { done, renderWidget } = handle(action, name);
			await done;
			expect(renderWidget).not.toHaveBeenCalled();
		}
	});
});
