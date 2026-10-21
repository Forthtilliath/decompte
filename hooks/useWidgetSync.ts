import { useEffect } from "react";
import { Platform } from "react-native";
import { requestWidgetUpdate } from "react-native-android-widget";
import { computeWidgetSummary, type WidgetData } from "@/lib/widgetSummary";
import { useGamesStore } from "@/stores/gamesStore";
import { useHistoryStore } from "@/stores/historyStore";
import { usePlayersStore } from "@/stores/playersStore";
import { useSessionStore } from "@/stores/sessionStore";
import { renderDecompteWidget, WIDGET_NAME } from "@/widget/DecompteWidget";

/** Regroupe les changements rapprochés (saisie des scores) en une seule mise à jour. */
const UPDATE_DELAY_MS = 1000;

function currentWidgetData(): WidgetData {
	const session = useSessionStore.getState();
	return {
		ongoingGameId: session.playerIds.length > 0 ? session.gameDefId : null,
		ongoingPlayerCount: session.playerIds.length,
		sessions: useHistoryStore.getState().sessions,
		games: useGamesStore.getState().games,
		players: usePlayersStore.getState().players,
	};
}

/**
 * Tient le widget d'écran d'accueil à jour pendant que l'app tourne : partie lancée, terminée ou
 * abandonnée, historique, jeux ou joueurs modifiés. App fermée, Android le rafraîchit lui-même
 * (widget/widgetTaskHandler). Sans widget posé, la demande ne fait rien.
 */
export function useWidgetSync() {
	useEffect(() => {
		if (Platform.OS !== "android") return;
		let timer: ReturnType<typeof setTimeout> | undefined;
		const schedule = () => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				requestWidgetUpdate({
					widgetName: WIDGET_NAME,
					renderWidget: () => renderDecompteWidget(computeWidgetSummary(currentWidgetData())),
				}).catch(() => {
					// Widget indisponible : rien à afficher, l'app continue.
				});
			}, UPDATE_DELAY_MS);
		};

		const unsubscribes = [
			// La saisie des scores ne change pas le widget : seuls le lancement et la fin comptent.
			useSessionStore.subscribe((state, previous) => {
				if (state.gameDefId !== previous.gameDefId || state.playerIds !== previous.playerIds) {
					schedule();
				}
			}),
			useHistoryStore.subscribe((state, previous) => {
				if (state.sessions !== previous.sessions) schedule();
			}),
			useGamesStore.subscribe((state, previous) => {
				if (state.games !== previous.games) schedule();
			}),
			usePlayersStore.subscribe((state, previous) => {
				if (state.players !== previous.players) schedule();
			}),
		];
		schedule();
		return () => {
			clearTimeout(timer);
			for (const unsubscribe of unsubscribes) unsubscribe();
		};
	}, []);
}
