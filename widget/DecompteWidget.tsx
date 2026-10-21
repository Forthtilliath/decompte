import { FlexWidget, TextWidget } from "react-native-android-widget";
import { plural } from "@/lib/plural";
import type { WidgetSummary } from "@/lib/widgetSummary";

/** Nom du widget, le même que dans le plugin d'app.json. */
export const WIDGET_NAME = "Decompte";

/** Ouvre l'onglet Jeux, qui propose de reprendre la partie en cours. */
const OPEN_GAMES = { clickAction: "OPEN_URI", clickActionData: { uri: "decompte://jeux" } };

type Palette = {
	background: `#${string}`;
	text: `#${string}`;
	muted: `#${string}`;
	accent: `#${string}`;
};

const LIGHT: Palette = {
	background: "#ffffff",
	text: "#0f172a",
	muted: "#64748b",
	accent: "#b45309",
};
const DARK: Palette = {
	background: "#1e293b",
	text: "#f1f5f9",
	muted: "#94a3b8",
	accent: "#fbbf24",
};

function lines(summary: WidgetSummary): { title: string; main: string; detail: string } {
	switch (summary.kind) {
		case "ongoing":
			return {
				title: "Partie en cours",
				main: summary.gameName,
				detail: `${summary.playerCount} ${plural(summary.playerCount, "joueur")} · touche pour reprendre`,
			};
		case "lastWinner":
			return {
				title: `Dernière partie · ${summary.gameName}`,
				main: `🏆 ${summary.winners}`,
				detail: `${summary.total} points · ${summary.date}`,
			};
		case "empty":
			return { title: "Décompte", main: "Aucune partie", detail: "Touche pour en lancer une" };
	}
}

function WidgetBody({ summary, palette }: { summary: WidgetSummary; palette: Palette }) {
	const { title, main, detail } = lines(summary);
	return (
		<FlexWidget
			{...OPEN_GAMES}
			accessibilityLabel={`${title}. ${main}. ${detail}`}
			style={{
				height: "match_parent",
				width: "match_parent",
				justifyContent: "center",
				padding: 14,
				borderRadius: 18,
				backgroundColor: palette.background,
				flexGap: 4,
			}}
		>
			<TextWidget
				text={title}
				maxLines={1}
				truncate="END"
				style={{ fontSize: 12, color: palette.muted }}
			/>
			<TextWidget
				text={main}
				maxLines={1}
				truncate="END"
				style={{ fontSize: 18, fontWeight: "700", color: palette.text }}
			/>
			<TextWidget
				text={detail}
				maxLines={1}
				truncate="END"
				style={{ fontSize: 12, color: palette.accent }}
			/>
		</FlexWidget>
	);
}

/** Widget d'écran d'accueil, en thème clair et sombre (choisi par le système). */
export function renderDecompteWidget(summary: WidgetSummary) {
	return {
		light: <WidgetBody summary={summary} palette={LIGHT} />,
		dark: <WidgetBody summary={summary} palette={DARK} />,
	};
}
